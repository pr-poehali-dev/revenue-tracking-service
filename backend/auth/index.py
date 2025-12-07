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
            email = body.get('email')
            password = body.get('password')
            first_name = body.get('first_name')
            last_name = body.get('last_name')
            middle_name = body.get('middle_name')
            phone = body.get('phone')
            company_name = body.get('company_name')
            
            if not all([email, password, first_name, last_name, company_name]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заполните все обязательные поля'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cur.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email уже зарегистрирован'}),
                    'isBase64Encoded': False
                }
            
            code = ''.join([str(secrets.randbelow(10)) for _ in range(4)])
            code_expires = datetime.utcnow() + timedelta(minutes=15)
            password_hash = hash_password(password)
            
            cur.execute("""
                INSERT INTO users (email, password_hash, first_name, last_name, middle_name, phone, 
                                   email_verification_code, verification_code_expires_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (email, password_hash, first_name, last_name, middle_name, phone, code, code_expires))
            
            user_id = cur.fetchone()[0]
            
            cur.execute("INSERT INTO companies (name) VALUES (%s) RETURNING id", (company_name,))
            company_id = cur.fetchone()[0]
            
            cur.execute("""
                INSERT INTO company_users (company_id, user_id, role)
                VALUES (%s, %s, 'owner')
            """, (company_id, user_id))
            
            conn.commit()
            
            email_sent = send_verification_email(email, code)
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'Код подтверждения отправлен на email',
                    'email_sent': email_sent,
                    'user_id': user_id
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'verify':
            email = body.get('email')
            code = body.get('code')
            
            if not email or not code:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email и код обязательны'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                SELECT id, email_verification_code, verification_code_expires_at, is_email_verified
                FROM users WHERE email = %s
            """, (email,))
            
            user = cur.fetchone()
            if not user:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь не найден'}),
                    'isBase64Encoded': False
                }
            
            user_id, stored_code, expires_at, is_verified = user
            
            if is_verified:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email уже подтверждён'}),
                    'isBase64Encoded': False
                }
            
            if datetime.utcnow() > expires_at:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Код истёк. Запросите новый'}),
                    'isBase64Encoded': False
                }
            
            if code != stored_code:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверный код'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                UPDATE users SET is_email_verified = TRUE, 
                email_verification_code = NULL, verification_code_expires_at = NULL
                WHERE id = %s
            """, (user_id,))
            
            conn.commit()
            
            token = generate_jwt(user_id, email)
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'Email успешно подтверждён',
                    'token': token,
                    'user_id': user_id
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'login':
            email = body.get('email')
            password = body.get('password')
            
            if not email or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email и пароль обязательны'}),
                    'isBase64Encoded': False
                }
            
            password_hash = hash_password(password)
            
            cur.execute("""
                SELECT id, is_email_verified FROM users 
                WHERE email = %s AND password_hash = %s
            """, (email, password_hash))
            
            user = cur.fetchone()
            if not user:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверный email или пароль'}),
                    'isBase64Encoded': False
                }
            
            user_id, is_verified = user
            
            if not is_verified:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email не подтверждён'}),
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
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }
