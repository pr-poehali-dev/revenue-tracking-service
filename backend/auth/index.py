import json
import os
import psycopg2
import smtplib
import secrets
import hashlib
import jwt
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Dict, Any

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def escape_sql_string(s: str) -> str:
    """Экранирование строк для Simple Query Protocol"""
    if s is None:
        return 'NULL'
    return "'" + s.replace("'", "''") + "'"

def send_verification_email(email: str, code: str) -> bool:
    try:
        smtp_host = os.environ['SMTP_HOST']
        smtp_port = int(os.environ['SMTP_PORT'])
        smtp_user = os.environ['SMTP_USER']
        smtp_password = os.environ['SMTP_PASSWORD']
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Код подтверждения регистрации'
        msg['From'] = smtp_user
        msg['To'] = email
        
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0EA5E9;">Подтверждение регистрации</h2>
            <p>Ваш код подтверждения:</p>
            <div style="background: #f0f9ff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <h1 style="color: #0EA5E9; font-size: 36px; margin: 0; letter-spacing: 8px;">{code}</h1>
            </div>
            <p style="color: #666;">Код действителен в течение 15 минут.</p>
            <p style="color: #999; font-size: 12px;">Если вы не регистрировались, просто игнорируйте это письмо.</p>
          </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_jwt(user_id: int, email: str) -> str:
    secret = os.environ['JWT_SECRET']
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, secret, algorithm='HS256')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Обрабатывает регистрацию, подтверждение email и вход пользователей
    Args: event - HTTP запрос с action: register/verify/login
          context - контекст выполнения функции
    Returns: JSON с результатом операции
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        if action == 'register':
            email = body.get('email', '')
            password = body.get('password', '')
            first_name = body.get('first_name', '')
            last_name = body.get('last_name', '')
            middle_name = body.get('middle_name', '')
            phone = body.get('phone', '')
            company_name = body.get('company_name', '')
            
            if not all([email, password, first_name, last_name, company_name]):
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заполните все обязательные поля'}),
                    'isBase64Encoded': False
                }
            
            # Проверка существующего пользователя
            cur.execute(f"SELECT id FROM users WHERE email = {escape_sql_string(email)}")
            if cur.fetchone():
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email уже зарегистрирован'}),
                    'isBase64Encoded': False
                }
            
            code = ''.join([str(secrets.randbelow(10)) for _ in range(4)])
            code_expires = (datetime.utcnow() + timedelta(minutes=15)).isoformat()
            password_hash = hash_password(password)
            
            middle_name_sql = escape_sql_string(middle_name) if middle_name else 'NULL'
            phone_sql = escape_sql_string(phone) if phone else 'NULL'
            
            cur.execute(f"""
                INSERT INTO users (email, password_hash, first_name, last_name, middle_name, phone, 
                                   email_verification_code, verification_code_expires_at)
                VALUES ({escape_sql_string(email)}, {escape_sql_string(password_hash)}, 
                        {escape_sql_string(first_name)}, {escape_sql_string(last_name)}, 
                        {middle_name_sql}, {phone_sql}, 
                        {escape_sql_string(code)}, '{code_expires}')
                RETURNING id
            """)
            
            user_id = cur.fetchone()[0]
            
            cur.execute(f"INSERT INTO companies (name) VALUES ({escape_sql_string(company_name)}) RETURNING id")
            company_id = cur.fetchone()[0]
            
            cur.execute(f"""
                INSERT INTO company_users (company_id, user_id, role)
                VALUES ({company_id}, {user_id}, 'owner')
            """)
            
            conn.commit()
            
            # Отправка email не должна ломать процесс регистрации
            email_sent = False
            try:
                email_sent = send_verification_email(email, code)
            except Exception as email_error:
                print(f"Failed to send email: {email_error}")
            
            cur.close()
            conn.close()
            
            message = 'Код подтверждения отправлен на email' if email_sent else f'Регистрация завершена. Код подтверждения: {code}'
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': message,
                    'email_sent': email_sent,
                    'user_id': user_id,
                    'code': code if not email_sent else None
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'verify':
            email = body.get('email', '')
            code = body.get('code', '')
            
            if not email or not code:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email и код обязательны'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                SELECT id, email_verification_code, verification_code_expires_at, is_email_verified
                FROM users WHERE email = {escape_sql_string(email)}
            """)
            
            user = cur.fetchone()
            if not user:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь не найден'}),
                    'isBase64Encoded': False
                }
            
            user_id, stored_code, expires_at, is_verified = user
            
            if is_verified:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email уже подтверждён'}),
                    'isBase64Encoded': False
                }
            
            if datetime.utcnow() > expires_at:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Код истёк. Запросите новый'}),
                    'isBase64Encoded': False
                }
            
            if code != stored_code:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверный код'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                UPDATE users SET is_email_verified = TRUE, 
                email_verification_code = NULL, verification_code_expires_at = NULL
                WHERE id = {user_id}
            """)
            conn.commit()
            
            token = generate_jwt(user_id, email)
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'token': token,
                    'user_id': user_id
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'login':
            email = body.get('email', '')
            password = body.get('password', '')
            
            if not email or not password:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email и пароль обязательны'}),
                    'isBase64Encoded': False
                }
            
            password_hash = hash_password(password)
            
            cur.execute(f"""
                SELECT id, is_email_verified FROM users 
                WHERE email = {escape_sql_string(email)} AND password_hash = {escape_sql_string(password_hash)}
            """)
            
            user = cur.fetchone()
            if not user:
                cur.close()
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверный email или пароль'}),
                    'isBase64Encoded': False
                }
            
            user_id, is_verified = user
            
            if not is_verified:
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email не подтверждён. Проверьте почту'}),
                    'isBase64Encoded': False
                }
            
            token = generate_jwt(user_id, email)
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'token': token,
                    'user_id': user_id
                }),
                'isBase64Encoded': False
            }
        
        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неизвестное действие'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }