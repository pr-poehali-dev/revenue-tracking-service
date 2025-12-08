import json
import os
import psycopg2
from typing import Dict, Any

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def escape_sql_string(s: str) -> str:
    if s is None:
        return 'NULL'
    return "'" + s.replace("'", "''") + "'"

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Управление сотрудниками компании: просмотр, добавление, редактирование, удаление
    Args: event - HTTP запрос с методами GET/POST/PUT/DELETE
          context - контекст выполнения функции
    Returns: JSON с результатом операции
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Company-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        headers = event.get('headers', {})
        user_id = headers.get('X-User-Id') or headers.get('x-user-id')
        company_id_header = headers.get('X-Company-Id') or headers.get('x-company-id')
        
        if not user_id or not company_id_header:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Требуется авторизация'}),
                'isBase64Encoded': False
            }
        
        user_id = int(user_id)
        company_id = int(company_id_header)
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Проверяем доступ пользователя к компании и получаем роль
        cur.execute(f"""
            SELECT company_id, role
            FROM company_users
            WHERE user_id = {user_id} AND company_id = {company_id}
        """)
        user_data = cur.fetchone()
        
        if not user_data:
            cur.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Доступ к компании запрещён'}),
                'isBase64Encoded': False
            }
        
        user_role = user_data[1]
        
        if method == 'GET':
            # Получение списка сотрудников компании
            cur.execute(f"""
                SELECT u.id, u.email, u.first_name, u.last_name, u.middle_name, 
                       u.phone, u.avatar_url, cu.role, cu.created_at
                FROM users u
                JOIN company_users cu ON u.id = cu.user_id
                WHERE cu.company_id = {company_id}
                ORDER BY 
                    CASE cu.role
                        WHEN 'owner' THEN 1
                        WHEN 'admin' THEN 2
                        WHEN 'user' THEN 3
                        WHEN 'viewer' THEN 4
                        ELSE 5
                    END,
                    u.last_name, u.first_name
            """)
            
            employees = []
            for emp in cur.fetchall():
                employees.append({
                    'id': emp[0],
                    'email': emp[1],
                    'first_name': emp[2],
                    'last_name': emp[3],
                    'middle_name': emp[4],
                    'phone': emp[5],
                    'avatar_url': emp[6],
                    'role': emp[7],
                    'joined_at': emp[8].isoformat() if emp[8] else None
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'employees': employees,
                    'current_user_role': user_role
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            # Добавление нового сотрудника (только owner и admin)
            if user_role not in ['owner', 'admin']:
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно прав'}),
                    'isBase64Encoded': False
                }
            
            body = json.loads(event.get('body', '{}'))
            email = body.get('email')
            role = body.get('role', 'user')
            
            if not email:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email обязателен'}),
                    'isBase64Encoded': False
                }
            
            # Проверка прав на назначение роли
            if user_role == 'admin' and role in ['owner', 'admin']:
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Администратор не может назначать роли owner и admin'}),
                    'isBase64Encoded': False
                }
            
            # Проверка существования пользователя
            cur.execute(f"""
                SELECT id FROM users WHERE email = {escape_sql_string(email)}
            """)
            existing_user = cur.fetchone()
            
            if not existing_user:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь с таким email не найден'}),
                    'isBase64Encoded': False
                }
            
            employee_id = existing_user[0]
            
            # Проверка, не состоит ли уже в компании
            cur.execute(f"""
                SELECT id FROM company_users 
                WHERE company_id = {company_id} AND user_id = {employee_id}
            """)
            
            if cur.fetchone():
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь уже состоит в компании'}),
                    'isBase64Encoded': False
                }
            
            # Добавляем сотрудника
            cur.execute(f"""
                INSERT INTO company_users (company_id, user_id, role, created_at)
                VALUES ({company_id}, {employee_id}, {escape_sql_string(role)}, NOW())
            """)
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Сотрудник добавлен'}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            # Изменение роли сотрудника (только owner и admin)
            if user_role not in ['owner', 'admin']:
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно прав'}),
                    'isBase64Encoded': False
                }
            
            body = json.loads(event.get('body', '{}'))
            employee_id = body.get('employee_id')
            new_role = body.get('role')
            
            if not employee_id or not new_role:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'employee_id и role обязательны'}),
                    'isBase64Encoded': False
                }
            
            # Проверка прав на назначение роли
            if user_role == 'admin' and new_role in ['owner', 'admin']:
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Администратор не может назначать роли owner и admin'}),
                    'isBase64Encoded': False
                }
            
            # Получаем текущую роль сотрудника
            cur.execute(f"""
                SELECT role FROM company_users 
                WHERE company_id = {company_id} AND user_id = {employee_id}
            """)
            current_role_data = cur.fetchone()
            
            if not current_role_data:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Сотрудник не найден'}),
                    'isBase64Encoded': False
                }
            
            current_role = current_role_data[0]
            
            # Администратор не может редактировать owner и admin
            if user_role == 'admin' and current_role in ['owner', 'admin']:
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Администратор не может редактировать owner и admin'}),
                    'isBase64Encoded': False
                }
            
            # Нельзя изменить роль owner
            if current_role == 'owner':
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Нельзя изменить роль владельца'}),
                    'isBase64Encoded': False
                }
            
            # Обновляем роль
            cur.execute(f"""
                UPDATE company_users
                SET role = {escape_sql_string(new_role)}
                WHERE company_id = {company_id} AND user_id = {employee_id}
            """)
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Роль обновлена'}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            # Удаление сотрудника из компании (только owner и admin)
            if user_role not in ['owner', 'admin']:
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно прав'}),
                    'isBase64Encoded': False
                }
            
            query_params = event.get('queryStringParameters') or {}
            employee_id = query_params.get('employee_id')
            
            if not employee_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'employee_id обязателен'}),
                    'isBase64Encoded': False
                }
            
            employee_id = int(employee_id)
            
            # Получаем роль удаляемого сотрудника
            cur.execute(f"""
                SELECT role FROM company_users 
                WHERE company_id = {company_id} AND user_id = {employee_id}
            """)
            employee_role_data = cur.fetchone()
            
            if not employee_role_data:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Сотрудник не найден'}),
                    'isBase64Encoded': False
                }
            
            employee_role = employee_role_data[0]
            
            # Нельзя удалить owner
            if employee_role == 'owner':
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Нельзя удалить владельца'}),
                    'isBase64Encoded': False
                }
            
            # Администратор не может удалять owner и admin
            if user_role == 'admin' and employee_role in ['owner', 'admin']:
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Администратор не может удалять owner и admin'}),
                    'isBase64Encoded': False
                }
            
            # Удаляем сотрудника из компании
            cur.execute(f"""
                DELETE FROM company_users 
                WHERE company_id = {company_id} AND user_id = {employee_id}
            """)
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Сотрудник удален'}),
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
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }