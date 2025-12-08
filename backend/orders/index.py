import json
import os
import psycopg2
from datetime import datetime
from typing import Dict, Any

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
    Управление заказами: создание, чтение, обновление, удаление
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
            order_id = query_params.get('id')
            status_filter = query_params.get('status')
            
            if order_id:
                cur.execute(f"""
                    SELECT o.id, o.name, o.description, o.amount, o.order_status, o.payment_status, 
                           o.payment_type, o.planned_date, o.actual_date, o.project_id, 
                           o.created_at, o.updated_at, o.status,
                           p.name as project_name, c.name as client_name
                    FROM orders o
                    LEFT JOIN projects p ON o.project_id = p.id
                    LEFT JOIN clients c ON p.client_id = c.id
                    WHERE o.id = {int(order_id)} AND o.company_id = {company_id}
                """)
                
                order = cur.fetchone()
                if not order:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заказ не найден'}),
                        'isBase64Encoded': False
                    }
                
                result = {
                    'id': order[0],
                    'name': order[1],
                    'description': order[2],
                    'amount': float(order[3]) if order[3] else 0,
                    'order_status': order[4],
                    'payment_status': order[5],
                    'payment_type': order[6],
                    'planned_date': order[7].isoformat() if order[7] else None,
                    'actual_date': order[8].isoformat() if order[8] else None,
                    'project_id': order[9],
                    'created_at': order[10].isoformat() if order[10] else None,
                    'updated_at': order[11].isoformat() if order[11] else None,
                    'status': order[12],
                    'project_name': order[13],
                    'client_name': order[14]
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
                    SELECT o.id, o.name, o.description, o.amount, o.order_status, o.payment_status, 
                           o.payment_type, o.planned_date, o.project_id, o.created_at,
                           p.name as project_name, c.name as client_name
                    FROM orders o
                    LEFT JOIN projects p ON o.project_id = p.id
                    LEFT JOIN clients c ON p.client_id = c.id
                    WHERE o.company_id = {company_id} AND o.status = {escape_sql_string(status_filter)}
                    ORDER BY o.created_at DESC
                """)
                
                orders = cur.fetchall()
                
                result = [
                    {
                        'id': row[0],
                        'name': row[1],
                        'description': row[2],
                        'amount': float(row[3]) if row[3] else 0,
                        'order_status': row[4],
                        'payment_status': row[5],
                        'payment_type': row[6],
                        'planned_date': row[7].isoformat() if row[7] else None,
                        'project_id': row[8],
                        'created_at': row[9].isoformat() if row[9] else None,
                        'project_name': row[10],
                        'client_name': row[11]
                    }
                    for row in orders
                ]
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'orders': result}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            name = body.get('name', '').strip()
            description = body.get('description', '').strip()
            amount = body.get('amount', 0)
            order_status = body.get('order_status', 'new')
            payment_status = body.get('payment_status', 'not_paid')
            payment_type = body.get('payment_type', 'postpaid')
            planned_date = body.get('planned_date')
            actual_date = body.get('actual_date')
            project_id = body.get('project_id')
            
            if not name:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Название заказа обязательно'}),
                    'isBase64Encoded': False
                }
            
            description_sql = escape_sql_string(description) if description else 'NULL'
            project_id_sql = str(int(project_id)) if project_id else 'NULL'
            planned_date_sql = escape_sql_string(planned_date) if planned_date else 'NULL'
            actual_date_sql = escape_sql_string(actual_date) if actual_date else 'NULL'
            
            cur.execute(f"""
                INSERT INTO orders (company_id, name, description, amount, order_status, payment_status, 
                                   payment_type, planned_date, actual_date, project_id, status)
                VALUES ({company_id}, {escape_sql_string(name)}, {description_sql}, {amount}, 
                        {escape_sql_string(order_status)}, {escape_sql_string(payment_status)}, 
                        {escape_sql_string(payment_type)}, {planned_date_sql}, {actual_date_sql}, {project_id_sql}, 'active')
                RETURNING id
            """)
            
            order_id = cur.fetchone()[0]
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'order_id': order_id}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            order_id = body.get('id')
            name = body.get('name', '').strip()
            description = body.get('description', '').strip()
            amount = body.get('amount', 0)
            order_status = body.get('order_status', 'new')
            status = body.get('status', 'active')
            payment_status = body.get('payment_status', 'not_paid')
            payment_type = body.get('payment_type', 'postpaid')
            planned_date = body.get('planned_date')
            actual_date = body.get('actual_date')
            project_id = body.get('project_id')
            
            if not order_id or not name:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID и название заказа обязательны'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                SELECT id FROM orders 
                WHERE id = {int(order_id)} AND company_id = {company_id}
            """)
            
            if not cur.fetchone():
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заказ не найден'}),
                    'isBase64Encoded': False
                }
            
            description_sql = escape_sql_string(description) if description else 'NULL'
            project_id_sql = str(int(project_id)) if project_id else 'NULL'
            planned_date_sql = escape_sql_string(planned_date) if planned_date else 'NULL'
            actual_date_sql = escape_sql_string(actual_date) if actual_date else 'NULL'
            
            if status not in ['active', 'archived', 'removed']:
                status = 'active'
            
            cur.execute(f"""
                UPDATE orders 
                SET name = {escape_sql_string(name)}, 
                    description = {description_sql},
                    amount = {amount},
                    order_status = {escape_sql_string(order_status)},
                    status = {escape_sql_string(status)},
                    payment_status = {escape_sql_string(payment_status)},
                    payment_type = {escape_sql_string(payment_type)},
                    planned_date = {planned_date_sql},
                    actual_date = {actual_date_sql},
                    project_id = {project_id_sql},
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = {int(order_id)}
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
            order_id = query_params.get('id')
            
            if not order_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID заказа обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                SELECT id, status FROM orders 
                WHERE id = {int(order_id)} AND company_id = {company_id}
            """)
            
            row = cur.fetchone()
            if not row:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заказ не найден'}),
                    'isBase64Encoded': False
                }
            
            if row[1] == 'removed':
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заказ уже удалён'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                UPDATE orders 
                SET status = 'removed', updated_at = CURRENT_TIMESTAMP 
                WHERE id = {int(order_id)}
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