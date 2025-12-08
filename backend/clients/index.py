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
    """Проверяет, что пользователь имеет доступ к указанной компании"""
    cur.execute(f"SELECT company_id FROM company_users WHERE user_id = {user_id} AND company_id = {company_id}")
    result = cur.fetchone()
    if not result:
        raise Exception('Доступ к компании запрещён')
    return result[0]

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Управление клиентами: создание, чтение, обновление, удаление
    Args: event - HTTP запрос с action: list/get/create/update/delete
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
            client_id = query_params.get('id')
            status_filter = query_params.get('status', 'active')
            
            if client_id:
                cur.execute(f"""
                    SELECT id, name, notes, status, created_at, updated_at
                    FROM clients 
                    WHERE id = {int(client_id)} AND company_id = {company_id}
                """)
                
                client = cur.fetchone()
                if not client:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Клиент не найден'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"""
                    SELECT id, full_name, position, phone, email
                    FROM client_contacts
                    WHERE client_id = {int(client_id)}
                    ORDER BY id
                """)
                contacts = cur.fetchall()
                
                result = {
                    'id': client[0],
                    'name': client[1],
                    'notes': client[2],
                    'status': client[3],
                    'created_at': client[4].isoformat() if client[4] else None,
                    'updated_at': client[5].isoformat() if client[5] else None,
                    'contacts': [
                        {
                            'id': c[0],
                            'full_name': c[1],
                            'position': c[2],
                            'phone': c[3],
                            'email': c[4]
                        }
                        for c in contacts
                    ]
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
                    SELECT c.id, c.name, c.notes, c.status, c.created_at,
                           COUNT(cc.id) as contacts_count
                    FROM clients c
                    LEFT JOIN client_contacts cc ON c.id = cc.client_id
                    WHERE c.company_id = {company_id} AND c.status = {escape_sql_string(status_filter)}
                    GROUP BY c.id, c.name, c.notes, c.status, c.created_at
                    ORDER BY c.created_at DESC
                """)
                
                clients = cur.fetchall()
                
                result = [
                    {
                        'id': row[0],
                        'name': row[1],
                        'notes': row[2],
                        'status': row[3],
                        'created_at': row[4].isoformat() if row[4] else None,
                        'contacts_count': row[5]
                    }
                    for row in clients
                ]
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'clients': result}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            name = body.get('name', '').strip()
            notes = body.get('notes', '').strip()
            contacts = body.get('contacts', [])
            
            if not name:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Название клиента обязательно'}),
                    'isBase64Encoded': False
                }
            
            notes_sql = escape_sql_string(notes) if notes else 'NULL'
            
            cur.execute(f"""
                INSERT INTO clients (company_id, name, notes, status)
                VALUES ({company_id}, {escape_sql_string(name)}, {notes_sql}, 'active')
                RETURNING id
            """)
            
            client_id = cur.fetchone()[0]
            
            for contact in contacts:
                full_name = contact.get('full_name', '').strip()
                if not full_name:
                    continue
                
                position = contact.get('position', '').strip()
                phone = contact.get('phone', '').strip()
                email = contact.get('email', '').strip()
                
                position_sql = escape_sql_string(position) if position else 'NULL'
                phone_sql = escape_sql_string(phone) if phone else 'NULL'
                email_sql = escape_sql_string(email) if email else 'NULL'
                
                cur.execute(f"""
                    INSERT INTO client_contacts (client_id, full_name, position, phone, email)
                    VALUES ({client_id}, {escape_sql_string(full_name)}, {position_sql}, {phone_sql}, {email_sql})
                """)
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'client_id': client_id}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            client_id = body.get('id')
            name = body.get('name', '').strip()
            notes = body.get('notes', '').strip()
            status = body.get('status', 'active')
            contacts = body.get('contacts', [])
            
            if not client_id or not name:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID и название клиента обязательны'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                SELECT id FROM clients 
                WHERE id = {int(client_id)} AND company_id = {company_id}
            """)
            
            if not cur.fetchone():
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Клиент не найден'}),
                    'isBase64Encoded': False
                }
            
            notes_sql = escape_sql_string(notes) if notes else 'NULL'
            
            if status not in ['active', 'archived', 'removed']:
                status = 'active'
            
            cur.execute(f"""
                UPDATE clients 
                SET name = {escape_sql_string(name)}, 
                    notes = {notes_sql},
                    status = {escape_sql_string(status)},
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = {int(client_id)}
            """)
            
            cur.execute(f"SELECT id FROM client_contacts WHERE client_id = {int(client_id)}")
            existing_contact_ids = {row[0] for row in cur.fetchall()}
            updated_contact_ids = set()
            
            for contact in contacts:
                contact_id = contact.get('id')
                full_name = contact.get('full_name', '').strip()
                
                if not full_name:
                    continue
                
                position = contact.get('position', '').strip()
                phone = contact.get('phone', '').strip()
                email = contact.get('email', '').strip()
                
                position_sql = escape_sql_string(position) if position else 'NULL'
                phone_sql = escape_sql_string(phone) if phone else 'NULL'
                email_sql = escape_sql_string(email) if email else 'NULL'
                
                if contact_id and contact_id in existing_contact_ids:
                    cur.execute(f"""
                        UPDATE client_contacts
                        SET full_name = {escape_sql_string(full_name)},
                            position = {position_sql},
                            phone = {phone_sql},
                            email = {email_sql}
                        WHERE id = {int(contact_id)}
                    """)
                    updated_contact_ids.add(contact_id)
                else:
                    cur.execute(f"""
                        INSERT INTO client_contacts (client_id, full_name, position, phone, email)
                        VALUES ({int(client_id)}, {escape_sql_string(full_name)}, {position_sql}, {phone_sql}, {email_sql})
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
            client_id = query_params.get('id')
            
            if not client_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID клиента обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                SELECT id, status FROM clients 
                WHERE id = {int(client_id)} AND company_id = {company_id}
            """)
            
            row = cur.fetchone()
            if not row:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Клиент не найден'}),
                    'isBase64Encoded': False
                }
            
            if row[1] == 'removed':
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Клиент уже удалён'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                UPDATE clients 
                SET status = 'removed', updated_at = CURRENT_TIMESTAMP 
                WHERE id = {int(client_id)}
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