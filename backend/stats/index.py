import json
import os
import psycopg2
from typing import Dict, Any
from datetime import datetime, timedelta

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Получение статистики по клиентам, проектам, выручке и заказам
    Args: event - dict с httpMethod и X-User-Id в headers
    Returns: Статистика с количеством и процентом роста
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    # Получаем company_id пользователя
    cur.execute("""
        SELECT current_company_id 
        FROM t_p27692930_revenue_tracking_ser.users 
        WHERE id = %s
    """, (user_id,))
    
    result = cur.fetchone()
    if not result or not result[0]:
        cur.close()
        conn.close()
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No company selected'}),
            'isBase64Encoded': False
        }
    
    company_id = result[0]
    
    # Дата месяц назад для расчета роста
    one_month_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    
    # Количество клиентов
    cur.execute("""
        SELECT COUNT(*) 
        FROM t_p27692930_revenue_tracking_ser.clients 
        WHERE company_id = %s
    """, (company_id,))
    clients_total = cur.fetchone()[0]
    
    cur.execute("""
        SELECT COUNT(*) 
        FROM t_p27692930_revenue_tracking_ser.clients 
        WHERE company_id = %s AND created_at >= %s
    """, (company_id, one_month_ago))
    clients_new = cur.fetchone()[0]
    
    # Количество проектов
    cur.execute("""
        SELECT COUNT(*) 
        FROM t_p27692930_revenue_tracking_ser.projects 
        WHERE company_id = %s
    """, (company_id,))
    projects_total = cur.fetchone()[0]
    
    cur.execute("""
        SELECT COUNT(*) 
        FROM t_p27692930_revenue_tracking_ser.projects 
        WHERE company_id = %s AND created_at >= %s
    """, (company_id, one_month_ago))
    projects_new = cur.fetchone()[0]
    
    # Общая выручка
    cur.execute("""
        SELECT COALESCE(SUM(actual_amount), 0) 
        FROM t_p27692930_revenue_tracking_ser.payments 
        WHERE company_id = %s
    """, (company_id,))
    revenue_total = float(cur.fetchone()[0])
    
    cur.execute("""
        SELECT COALESCE(SUM(actual_amount), 0) 
        FROM t_p27692930_revenue_tracking_ser.payments 
        WHERE company_id = %s AND actual_date >= %s
    """, (company_id, one_month_ago))
    revenue_month = float(cur.fetchone()[0])
    
    # Количество заказов
    cur.execute("""
        SELECT COUNT(*) 
        FROM t_p27692930_revenue_tracking_ser.orders 
        WHERE company_id = %s
    """, (company_id,))
    orders_total = cur.fetchone()[0]
    
    cur.execute("""
        SELECT COUNT(*) 
        FROM t_p27692930_revenue_tracking_ser.orders 
        WHERE company_id = %s AND created_at >= %s
    """, (company_id, one_month_ago))
    orders_new = cur.fetchone()[0]
    
    cur.close()
    conn.close()
    
    # Расчет процентов роста
    clients_growth = round((clients_new / clients_total * 100) if clients_total > 0 else 0)
    projects_growth = round((projects_new / projects_total * 100) if projects_total > 0 else 0)
    revenue_growth = round((revenue_month / revenue_total * 100) if revenue_total > 0 else 0)
    orders_growth = round((orders_new / orders_total * 100) if orders_total > 0 else 0)
    
    stats = {
        'clients': {
            'total': clients_total,
            'growth': clients_growth
        },
        'projects': {
            'total': projects_total,
            'growth': projects_growth
        },
        'revenue': {
            'total': revenue_total,
            'growth': revenue_growth
        },
        'orders': {
            'total': orders_total,
            'growth': orders_growth
        }
    }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(stats),
        'isBase64Encoded': False
    }