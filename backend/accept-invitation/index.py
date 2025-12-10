import json
import os
import psycopg2
import bcrypt
from typing import Dict, Any

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def escape_sql_string(s: str) -> str:
    if s is None:
        return 'NULL'
    return "'" + s.replace("'", "''") + "'"

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Принятие приглашения: создание нового пользователя и добавление в компанию
    Args: event - HTTP запрос с методами GET (проверка токена) и POST (установка пароля)
          context - контекст выполнения функции
    Returns: JSON с результатом операции
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        if method == 'GET':
            # Проверка токена приглашения
            params = event.get('queryStringParameters', {})
            token = params.get('token')
            
            if not token:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Токен обязателен'}),
                    'isBase64Encoded': False
                }
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Проверяем токен и срок действия
            cur.execute(f"""
                SELECT ei.id, ei.email, ei.company_id, ei.role, c.name as company_name,
                       ei.expires_at, ei.status
                FROM t_p27692930_revenue_tracking_ser.employee_invitations ei
                JOIN t_p27692930_revenue_tracking_ser.companies c ON c.id = ei.company_id
                WHERE ei.invitation_token = {escape_sql_string(token)}
            """)
            
            invitation = cur.fetchone()
            cur.close()
            conn.close()
            
            if not invitation:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Приглашение не найдено'}),
                    'isBase64Encoded': False
                }
            
            inv_id, email, company_id, role, company_name, expires_at, status = invitation
            
            if status == 'cancelled':
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Приглашение было отозвано'}),
                    'isBase64Encoded': False
                }
            
            if status != 'pending':
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Приглашение уже использовано'}),
                    'isBase64Encoded': False
                }
            
            # Проверяем не истёк ли токен
            from datetime import datetime
            if expires_at < datetime.now():
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Срок действия приглашения истёк'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'email': email,
                    'company_name': company_name,
                    'role': role
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            # Установка пароля и создание пользователя
            body = json.loads(event.get('body', '{}'))
            token = body.get('token')
            password = body.get('password')
            first_name = body.get('first_name')
            last_name = body.get('last_name')
            middle_name = body.get('middle_name', '')
            phone = body.get('phone', '')
            
            if not all([token, password, first_name, last_name]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Необходимо заполнить все обязательные поля'}),
                    'isBase64Encoded': False
                }
            
            if len(password) < 6:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пароль должен быть не менее 6 символов'}),
                    'isBase64Encoded': False
                }
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Получаем приглашение
            cur.execute(f"""
                SELECT id, email, company_id, role, status, expires_at
                FROM t_p27692930_revenue_tracking_ser.employee_invitations
                WHERE invitation_token = {escape_sql_string(token)}
            """)
            
            invitation = cur.fetchone()
            
            if not invitation:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Приглашение не найдено'}),
                    'isBase64Encoded': False
                }
            
            inv_id, email, company_id, role, status, expires_at = invitation
            
            if status == 'cancelled':
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Приглашение было отозвано'}),
                    'isBase64Encoded': False
                }
            
            if status != 'pending':
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Приглашение уже использовано'}),
                    'isBase64Encoded': False
                }
            
            from datetime import datetime
            if expires_at < datetime.now():
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Срок действия приглашения истёк'}),
                    'isBase64Encoded': False
                }
            
            # Проверяем, не существует ли уже пользователь
            cur.execute(f"""
                SELECT id FROM t_p27692930_revenue_tracking_ser.users
                WHERE email = {escape_sql_string(email)}
            """)
            existing_user = cur.fetchone()
            
            if existing_user:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь с таким email уже существует'}),
                    'isBase64Encoded': False
                }
            
            # Хешируем пароль
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Создаём пользователя
            cur.execute(f"""
                INSERT INTO t_p27692930_revenue_tracking_ser.users 
                (email, password_hash, first_name, last_name, middle_name, phone, 
                 is_email_verified, current_company_id, created_at, updated_at)
                VALUES ({escape_sql_string(email)}, {escape_sql_string(password_hash)},
                        {escape_sql_string(first_name)}, {escape_sql_string(last_name)},
                        {escape_sql_string(middle_name)}, {escape_sql_string(phone)},
                        true, {company_id}, NOW(), NOW())
                RETURNING id
            """)
            
            user_id = cur.fetchone()[0]
            
            # Добавляем в компанию
            cur.execute(f"""
                INSERT INTO t_p27692930_revenue_tracking_ser.company_users 
                (company_id, user_id, role, created_at)
                VALUES ({company_id}, {user_id}, {escape_sql_string(role)}, NOW())
            """)
            
            # Обновляем статус приглашения
            cur.execute(f"""
                UPDATE t_p27692930_revenue_tracking_ser.employee_invitations
                SET status = 'accepted', accepted_at = NOW()
                WHERE id = {inv_id}
            """)
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'message': 'Регистрация успешно завершена',
                    'user_id': user_id
                }),
                'isBase64Encoded': False
            }
        
        else:
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
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }