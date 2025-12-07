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

def get_user_company_id(user_id: int, cur) -> int:
    cur.execute(f"SELECT company_id FROM company_users WHERE user_id = {user_id} LIMIT 1")
    result = cur.fetchone()
    if not result:
        raise Exception('Пользователь не привязан к компании')
    return result[0]

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Управление платежами: создание, чтение, обновление, удаление
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
        
        company_id = get_user_company_id(user_id, cur)
        
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            payment_id = query_params.get('id')
            status_filter = query_params.get('status', 'active')
            
            if payment_id:
                cur.execute(f"""
                    SELECT p.id, p.planned_amount, p.planned_amount_percent, p.actual_amount, 
                           p.planned_date, p.actual_date, p.order_id, p.status,
                           p.created_at, p.updated_at,
                           o.name as order_name, o.amount as order_amount,
                           pr.name as project_name, c.name as client_name
                    FROM payments p
                    LEFT JOIN orders o ON p.order_id = o.id
                    LEFT JOIN projects pr ON o.project_id = pr.id
                    LEFT JOIN clients c ON pr.client_id = c.id
                    WHERE p.id = {int(payment_id)} AND p.company_id = {company_id}
                """)
                
                payment = cur.fetchone()
                if not payment:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Платёж не найден'}),
                        'isBase64Encoded': False
                    }
                
                result = {
                    'id': payment[0],
                    'planned_amount': float(payment[1]) if payment[1] else None,
                    'planned_amount_percent': float(payment[2]) if payment[2] else None,
                    'actual_amount': float(payment[3]) if payment[3] else 0,
                    'planned_date': payment[4].isoformat() if payment[4] else None,
                    'actual_date': payment[5].isoformat() if payment[5] else None,
                    'order_id': payment[6],
                    'status': payment[7],
                    'created_at': payment[8].isoformat() if payment[8] else None,
                    'updated_at': payment[9].isoformat() if payment[9] else None,
                    'order_name': payment[10],
                    'order_amount': float(payment[11]) if payment[11] else 0,
                    'project_name': payment[12],
                    'client_name': payment[13]
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
                    SELECT p.id, p.planned_amount, p.planned_amount_percent, p.actual_amount, 
                           p.planned_date, p.actual_date, p.order_id, p.created_at,
                           o.name as order_name, o.amount as order_amount,
                           pr.name as project_name, c.name as client_name
                    FROM payments p
                    LEFT JOIN orders o ON p.order_id = o.id
                    LEFT JOIN projects pr ON o.project_id = pr.id
                    LEFT JOIN clients c ON pr.client_id = c.id
                    WHERE p.company_id = {company_id} AND p.status = {escape_sql_string(status_filter)}
                    ORDER BY p.planned_date DESC NULLS LAST, p.created_at DESC
                """)
                
                payments = cur.fetchall()
                
                result = [
                    {
                        'id': row[0],
                        'planned_amount': float(row[1]) if row[1] else None,
                        'planned_amount_percent': float(row[2]) if row[2] else None,
                        'actual_amount': float(row[3]) if row[3] else 0,
                        'planned_date': row[4].isoformat() if row[4] else None,
                        'actual_date': row[5].isoformat() if row[5] else None,
                        'order_id': row[6],
                        'created_at': row[7].isoformat() if row[7] else None,
                        'order_name': row[8],
                        'order_amount': float(row[9]) if row[9] else 0,
                        'project_name': row[10],
                        'client_name': row[11]
                    }
                    for row in payments
                ]
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'payments': result}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            planned_amount = body.get('planned_amount')
            planned_amount_percent = body.get('planned_amount_percent')
            actual_amount = body.get('actual_amount', 0)
            planned_date = body.get('planned_date')
            actual_date = body.get('actual_date')
            order_id = body.get('order_id')
            
            if not order_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заказ обязателен'}),
                    'isBase64Encoded': False
                }
            
            planned_amount_sql = str(float(planned_amount)) if planned_amount else 'NULL'
            planned_amount_percent_sql = str(float(planned_amount_percent)) if planned_amount_percent else 'NULL'
            actual_amount_sql = str(float(actual_amount)) if actual_amount else '0'
            planned_date_sql = escape_sql_string(planned_date) if planned_date else 'NULL'
            actual_date_sql = escape_sql_string(actual_date) if actual_date else 'NULL'
            order_id_sql = str(int(order_id))
            
            cur.execute(f"""
                INSERT INTO payments (company_id, order_id, planned_amount, planned_amount_percent, 
                                     actual_amount, planned_date, actual_date, status)
                VALUES ({company_id}, {order_id_sql}, {planned_amount_sql}, {planned_amount_percent_sql}, 
                        {actual_amount_sql}, {planned_date_sql}, {actual_date_sql}, 'active')
                RETURNING id
            """)
            
            payment_id = cur.fetchone()[0]
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'payment_id': payment_id}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            payment_id = body.get('id')
            planned_amount = body.get('planned_amount')
            planned_amount_percent = body.get('planned_amount_percent')
            actual_amount = body.get('actual_amount', 0)
            planned_date = body.get('planned_date')
            actual_date = body.get('actual_date')
            order_id = body.get('order_id')
            status = body.get('status', 'active')
            
            if not payment_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID платежа обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                SELECT id FROM payments 
                WHERE id = {int(payment_id)} AND company_id = {company_id}
            """)
            
            if not cur.fetchone():
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Платёж не найден'}),
                    'isBase64Encoded': False
                }
            
            planned_amount_sql = str(float(planned_amount)) if planned_amount else 'NULL'
            planned_amount_percent_sql = str(float(planned_amount_percent)) if planned_amount_percent else 'NULL'
            actual_amount_sql = str(float(actual_amount)) if actual_amount else '0'
            planned_date_sql = escape_sql_string(planned_date) if planned_date else 'NULL'
            actual_date_sql = escape_sql_string(actual_date) if actual_date else 'NULL'
            order_id_sql = str(int(order_id)) if order_id else 'NULL'
            
            if status not in ['active', 'archived', 'removed']:
                status = 'active'
            
            cur.execute(f"""
                UPDATE payments 
                SET planned_amount = {planned_amount_sql},
                    planned_amount_percent = {planned_amount_percent_sql},
                    actual_amount = {actual_amount_sql},
                    planned_date = {planned_date_sql},
                    actual_date = {actual_date_sql},
                    order_id = {order_id_sql},
                    status = {escape_sql_string(status)},
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = {int(payment_id)}
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
            payment_id = query_params.get('id')
            
            if not payment_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'ID платежа обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                SELECT id, status FROM payments 
                WHERE id = {int(payment_id)} AND company_id = {company_id}
            """)
            
            row = cur.fetchone()
            if not row:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Платёж не найден'}),
                    'isBase64Encoded': False
                }
            
            if row[1] == 'removed':
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Платёж уже удалён'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                UPDATE payments 
                SET status = 'removed', updated_at = CURRENT_TIMESTAMP 
                WHERE id = {int(payment_id)}
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
