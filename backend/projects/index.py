import json
import os
import psycopg2
from datetime import datetime
from typing import Dict, Any, List

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def escape_sql_string(s: str) -> str:
    if s is None:
        return 'NULL'
    return "'" + s.replace("'", "''") + "'"

def get_user_company_id(user_id: int, company_id: int, cur) -> int:
    cur.execute(f"SELECT company_id FROM company_users WHERE user_id = {user_id} AND company_id = {company_id}")
    result = cur.fetchone()
    if not result:
        raise Exception('Доступ к компании запрещён')
    return result[0]

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Управление проектами: создание, чтение, обновление, удаление
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
        
        get_user_company_id(user_id, company_id, cur)
        
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            project_id = query_params.get('id')
            status_filter = query_params.get('status', 'active')
            
            if project_id:
                cur.execute(f"""
                    SELECT p.id, p.name, p.description, p.status, p.client_id, p.created_at, p.updated_at,
                           c.name as client_name
                    FROM projects p
                    LEFT JOIN clients c ON p.client_id = c.id
                    WHERE p.id = {int(project_id)} AND p.company_id = {company_id}
                """)
                
                project = cur.fetchone()
                if not project:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Проект не найден'}),
                        'isBase64Encoded': False
                    }
                
                result = {
                    'id': project[0],
                    'name': project[1],
                    'description': project[2],
                    'status': project[3],
                    'client_id': project[4],
                    'created_at': project[5].isoformat() if project[5] else None,
                    'updated_at': project[6].isoformat() if project[6] else None,
                    'client_name': project[7]
                }
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(result),
                    'isBase64Encoded': False
                }
            else:
                if status_filter not in ['active', 'archived']:
                    status_filter = 'active'
                
                cur.execute(f"""
                    SELECT p.id, p.name, p.description, p.status, p.client_id, p.created_at,
                           c.name as client_name
                    FROM projects p
                    LEFT JOIN clients c ON p.client_id = c.id
                    WHERE p.company_id = {company_id} AND p.status = {escape_sql_string(status_filter)}
                    ORDER BY p.created_at DESC
                """)
                
                projects = cur.fetchall()
                
                result = [
                    {
                        'id': row[0],
                        'name': row[1],
                        'description': row[2],
                        'status': row[3],
                        'client_id': row[4],
                        'created_at': row[5].isoformat() if row[5] else None,
                        'client_name': row[6]
                    }
                    for row in projects
                ]
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'projects': result}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            name = body.get('name', '').strip()
            description = body.get('description', '').strip()
            client_id = body.get('client_id')
            
            if not name:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Название проекта обязательно'}),
                    'isBase64Encoded': False
                }
            
            description_sql = escape_sql_string(description) if description else 'NULL'
            client_id_sql = str(int(client_id)) if client_id else 'NULL'
            
            cur.execute(f"""
                INSERT INTO projects (company_id, name, description, client_id, status)
                VALUES ({company_id}, {escape_sql_string(name)}, {description_sql}, {client_id_sql}, 'active')
                RETURNING id
            """)
            
            project_id = cur.fetchone()[0]
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'project_id': project_id}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            project_id = body.get('id')
            name = body.get('name', '').strip()
            description = body.get('description', '').strip()
            status = body.get('status', 'active')
            client_id = body.get('client_id')
            
            if not project_id or not name:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID и название проекта обязательны'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                SELECT id FROM projects 
                WHERE id = {int(project_id)} AND company_id = {company_id}
            """)
            
            if not cur.fetchone():
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Проект не найден'}),
                    'isBase64Encoded': False
                }
            
            description_sql = escape_sql_string(description) if description else 'NULL'
            client_id_sql = str(int(client_id)) if client_id else 'NULL'
            
            if status not in ['active', 'archived', 'removed']:
                status = 'active'
            
            cur.execute(f"""
                UPDATE projects 
                SET name = {escape_sql_string(name)}, 
                    description = {description_sql},
                    client_id = {client_id_sql},
                    status = {escape_sql_string(status)},
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = {int(project_id)}
            """)
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            query_params = event.get('queryStringParameters') or {}
            project_id = query_params.get('id')
            
            if not project_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID проекта обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                SELECT id, status FROM projects 
                WHERE id = {int(project_id)} AND company_id = {company_id}
            """)
            
            row = cur.fetchone()
            if not row:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Проект не найден'}),
                    'isBase64Encoded': False
                }
            
            if row[1] == 'removed':
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Проект уже удалён'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                UPDATE projects 
                SET status = 'removed', updated_at = CURRENT_TIMESTAMP 
                WHERE id = {int(project_id)}
            """)
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
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