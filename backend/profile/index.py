import json
import os
import psycopg2
import hashlib
import secrets
import base64
import boto3
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Dict, Any

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def escape_sql_string(s: str) -> str:
    if s is None:
        return 'NULL'
    return "'" + s.replace("'", "''") + "'"

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_verification_code() -> str:
    return ''.join([str(secrets.randbelow(10)) for _ in range(4)])

def send_email(to_email: str, subject: str, body: str):
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    
    msg = MIMEMultipart()
    msg['From'] = smtp_user
    msg['To'] = to_email
    msg['Subject'] = subject
    
    msg.attach(MIMEText(body, 'html', 'utf-8'))
    
    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Управление профилем пользователя: получение данных, обновление, смена пароля, смена email
    Args: event - HTTP запрос с методами GET/PUT/POST
          context - контекст выполнения функции
    Returns: JSON с результатом операции
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        headers = event.get('headers', {})
        user_id = headers.get('X-User-Id') or headers.get('x-user-id')
        
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Требуется авторизация'}),
                'isBase64Encoded': False
            }
        
        user_id = int(user_id)
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            action = query_params.get('action')
            
            if action == 'verify_email':
                code = query_params.get('code')
                if not code:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Код не указан'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"""
                    SELECT email_verification_code, verification_code_expires_at, email
                    FROM users
                    WHERE id = {user_id}
                """)
                
                user = cur.fetchone()
                if not user or not user[0]:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Код не найден'}),
                        'isBase64Encoded': False
                    }
                
                if datetime.now() > user[1]:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Код истек'}),
                        'isBase64Encoded': False
                    }
                
                if user[0] != code:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный код'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"""
                    UPDATE users
                    SET is_email_verified = TRUE,
                        email_verification_code = NULL,
                        verification_code_expires_at = NULL,
                        updated_at = NOW()
                    WHERE id = {user_id}
                """)
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Email подтвержден'}),
                    'isBase64Encoded': False
                }
            else:
                cur.execute(f"""
                    SELECT id, email, first_name, last_name, middle_name, phone, 
                           avatar_url, is_email_verified, created_at, current_company_id
                    FROM users
                    WHERE id = {user_id}
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
                
                cur.execute(f"""
                    SELECT c.id, c.name, cu.role
                    FROM companies c
                    JOIN company_users cu ON c.id = cu.company_id
                    WHERE cu.user_id = {user_id}
                    ORDER BY c.name
                """)
                companies = cur.fetchall()
                
                result = {
                    'id': user[0],
                    'email': user[1],
                    'first_name': user[2],
                    'last_name': user[3],
                    'middle_name': user[4],
                    'phone': user[5],
                    'avatar_url': user[6],
                    'is_email_verified': user[7],
                    'created_at': user[8].isoformat() if user[8] else None,
                    'current_company_id': user[9],
                    'companies': [{'id': c[0], 'name': c[1], 'role': c[2]} for c in companies]
                }
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result),
                    'isBase64Encoded': False
                }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'update_profile':
                first_name = body.get('first_name')
                last_name = body.get('last_name')
                middle_name = body.get('middle_name')
                phone = body.get('phone')
                
                if not first_name or not last_name:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Имя и фамилия обязательны'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"""
                    UPDATE users
                    SET first_name = {escape_sql_string(first_name)},
                        last_name = {escape_sql_string(last_name)},
                        middle_name = {escape_sql_string(middle_name) if middle_name else 'NULL'},
                        phone = {escape_sql_string(phone) if phone else 'NULL'},
                        updated_at = NOW()
                    WHERE id = {user_id}
                """)
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Профиль обновлен'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'change_password':
                new_password = body.get('new_password')
                
                if not new_password or len(new_password) < 6:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пароль должен быть не менее 6 символов'}),
                        'isBase64Encoded': False
                    }
                
                password_hash = hash_password(new_password)
                
                cur.execute(f"""
                    UPDATE users
                    SET password_hash = {escape_sql_string(password_hash)},
                        updated_at = NOW()
                    WHERE id = {user_id}
                """)
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Пароль изменен'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'request_email_change':
                new_email = body.get('new_email')
                
                if not new_email:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email обязателен'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"SELECT id FROM users WHERE email = {escape_sql_string(new_email)} AND id != {user_id}")
                if cur.fetchone():
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email уже используется'}),
                        'isBase64Encoded': False
                    }
                
                code = generate_verification_code()
                expires_at = datetime.now() + timedelta(minutes=10)
                
                cur.execute(f"""
                    UPDATE users
                    SET email_verification_code = {escape_sql_string(code)},
                        verification_code_expires_at = {escape_sql_string(expires_at.isoformat())}
                    WHERE id = {user_id}
                """)
                
                conn.commit()
                
                try:
                    email_body = f"""
                    <html>
                    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #333;">Подтверждение смены email</h2>
                        <p>Вы запросили изменение email адреса.</p>
                        <p>Ваш код подтверждения:</p>
                        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                            {code}
                        </div>
                        <p>Код действителен в течение 10 минут.</p>
                        <p style="color: #666; font-size: 14px;">Если вы не запрашивали смену email, проигнорируйте это письмо.</p>
                    </body>
                    </html>
                    """
                    
                    send_email(new_email, 'Подтверждение смены email', email_body)
                except Exception as e:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': f'Не удалось отправить email: {str(e)}'}),
                        'isBase64Encoded': False
                    }
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'message': f'Код подтверждения отправлен на {new_email}',
                        'new_email': new_email
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'switch_company':
                company_id = body.get('company_id')
                
                if not company_id:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'ID компании обязателен'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"""
                    SELECT id FROM company_users 
                    WHERE user_id = {user_id} AND company_id = {company_id}
                """)
                if not cur.fetchone():
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Нет доступа к этой компании'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"""
                    UPDATE users
                    SET current_company_id = {company_id},
                        updated_at = NOW()
                    WHERE id = {user_id}
                """)
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Компания переключена'}),
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
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'upload_avatar':
                image_base64 = body.get('image')
                
                if not image_base64:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Изображение не передано'}),
                        'isBase64Encoded': False
                    }
                
                try:
                    image_data = base64.b64decode(image_base64)
                    
                    s3 = boto3.client('s3',
                        endpoint_url='https://bucket.poehali.dev',
                        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
                    )
                    
                    filename = f"avatars/user_{user_id}_{int(datetime.now().timestamp())}.jpg"
                    
                    s3.put_object(
                        Bucket='files',
                        Key=filename,
                        Body=image_data,
                        ContentType='image/jpeg'
                    )
                    
                    avatar_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{filename}"
                    
                    cur.execute(f"""
                        UPDATE users
                        SET avatar_url = {escape_sql_string(avatar_url)},
                            updated_at = NOW()
                        WHERE id = {user_id}
                    """)
                    
                    conn.commit()
                    cur.close()
                    conn.close()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'message': 'Аватар загружен',
                            'avatar_url': avatar_url
                        }),
                        'isBase64Encoded': False
                    }
                    
                except Exception as e:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': f'Ошибка загрузки: {str(e)}'}),
                        'isBase64Encoded': False
                    }
            
            elif action == 'delete_avatar':
                cur.execute(f"""
                    UPDATE users
                    SET avatar_url = NULL,
                        updated_at = NOW()
                    WHERE id = {user_id}
                """)
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Аватар удален'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'confirm_email_change':
                code = body.get('code')
                new_email = body.get('new_email')
                
                if not code or not new_email:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Код и email обязательны'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"""
                    SELECT email_verification_code, verification_code_expires_at
                    FROM users
                    WHERE id = {user_id}
                """)
                
                user = cur.fetchone()
                if not user or not user[0]:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Код не найден'}),
                        'isBase64Encoded': False
                    }
                
                if datetime.now() > user[1]:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Код истек'}),
                        'isBase64Encoded': False
                    }
                
                if user[0] != code:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный код'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"""
                    UPDATE users
                    SET email = {escape_sql_string(new_email)},
                        is_email_verified = TRUE,
                        email_verification_code = NULL,
                        verification_code_expires_at = NULL,
                        updated_at = NOW()
                    WHERE id = {user_id}
                """)
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Email изменен'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'create_company':
                company_name = body.get('name')
                
                if not company_name or len(company_name.strip()) == 0:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Название компании обязательно'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"""
                    INSERT INTO companies (name, created_at, updated_at)
                    VALUES ({escape_sql_string(company_name)}, NOW(), NOW())
                    RETURNING id
                """)
                company_id = cur.fetchone()[0]
                
                cur.execute(f"""
                    INSERT INTO company_users (company_id, user_id, role, created_at)
                    VALUES ({company_id}, {user_id}, 'owner', NOW())
                """)
                
                cur.execute(f"""
                    UPDATE users
                    SET current_company_id = {company_id},
                        updated_at = NOW()
                    WHERE id = {user_id}
                """)
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'message': 'Компания создана',
                        'company_id': company_id
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
        
        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Метод не поддерживается'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Внутренняя ошибка: {str(e)}'}),
            'isBase64Encoded': False
        }