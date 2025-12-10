import json
import os
import psycopg2
import secrets
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

def send_invitation_email(email: str, token: str, company_name: str, inviter_name: str):
    """Отправка email с приглашением"""
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    app_url = os.environ.get('APP_URL', 'https://your-app.poehali.app')
    
    if not all([smtp_host, smtp_user, smtp_password]):
        raise Exception('SMTP настройки не заданы')
    
    # Ссылка для принятия приглашения
    invitation_url = f"{app_url}/accept-invitation?token={token}"
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'Приглашение в компанию {company_name}'
    msg['From'] = smtp_user
    msg['To'] = email
    
    text = f"""
    Здравствуйте!
    
    {inviter_name} приглашает вас присоединиться к компании {company_name} в системе Revenue Tracking.
    
    Для завершения регистрации перейдите по ссылке:
    {invitation_url}
    
    Ссылка действительна в течение 7 дней.
    
    Если вы не ожидали это приглашение, просто проигнорируйте это письмо.
    """
    
    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Приглашение в компанию</h2>
          <p>Здравствуйте!</p>
          <p><strong>{inviter_name}</strong> приглашает вас присоединиться к компании <strong>{company_name}</strong> в системе Revenue Tracking.</p>
          <p>Для завершения регистрации нажмите кнопку ниже:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{invitation_url}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Принять приглашение
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">
            Ссылка действительна в течение 7 дней.
          </p>
          <p style="font-size: 14px; color: #666;">
            Если вы не ожидали это приглашение, просто проигнорируйте это письмо.
          </p>
        </div>
      </body>
    </html>
    """
    
    part1 = MIMEText(text, 'plain')
    part2 = MIMEText(html, 'html')
    msg.attach(part1)
    msg.attach(part2)
    
    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Отправка приглашения сотруднику по email с токеном для регистрации
    Args: event - HTTP запрос с методом POST
          context - контекст выполнения функции
    Returns: JSON с результатом операции
    """
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Company-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
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
        
        body = json.loads(event.get('body', '{}'))
        email = body.get('email')
        role = body.get('role', 'user')
        
        if not email:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Email обязателен'}),
                'isBase64Encoded': False
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Проверяем права пользователя
        cur.execute(f"""
            SELECT cu.role, u.first_name, u.last_name, c.name
            FROM t_p27692930_revenue_tracking_ser.company_users cu
            JOIN t_p27692930_revenue_tracking_ser.users u ON u.id = cu.user_id
            JOIN t_p27692930_revenue_tracking_ser.companies c ON c.id = cu.company_id
            WHERE cu.user_id = {user_id} AND cu.company_id = {company_id}
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
        
        user_role, first_name, last_name, company_name = user_data
        
        if user_role not in ['owner', 'admin']:
            cur.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Недостаточно прав'}),
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
        
        # Проверяем, не существует ли уже пользователь
        cur.execute(f"""
            SELECT id FROM t_p27692930_revenue_tracking_ser.users 
            WHERE email = {escape_sql_string(email)}
        """)
        existing_user = cur.fetchone()
        
        if existing_user:
            # Проверяем, не состоит ли уже в компании
            cur.execute(f"""
                SELECT id FROM t_p27692930_revenue_tracking_ser.company_users 
                WHERE company_id = {company_id} AND user_id = {existing_user[0]}
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
        
        # Проверяем, нет ли активного приглашения
        cur.execute(f"""
            SELECT id FROM t_p27692930_revenue_tracking_ser.employee_invitations
            WHERE email = {escape_sql_string(email)} 
            AND company_id = {company_id}
            AND status = 'pending'
            AND expires_at > NOW()
        """)
        active_invitation = cur.fetchone()
        
        if active_invitation:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Активное приглашение уже существует'}),
                'isBase64Encoded': False
            }
        
        # Генерируем токен приглашения
        invitation_token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(days=7)
        
        # Сохраняем приглашение в БД
        cur.execute(f"""
            INSERT INTO t_p27692930_revenue_tracking_ser.employee_invitations 
            (company_id, email, role, invitation_token, invited_by, expires_at, status)
            VALUES ({company_id}, {escape_sql_string(email)}, {escape_sql_string(role)}, 
                    {escape_sql_string(invitation_token)}, {user_id}, 
                    '{expires_at.isoformat()}', 'pending')
        """)
        
        conn.commit()
        
        # Отправляем email
        inviter_name = f"{first_name} {last_name}"
        try:
            send_invitation_email(email, invitation_token, company_name, inviter_name)
        except Exception as e:
            # Откатываем транзакцию если не удалось отправить email
            conn.rollback()
            cur.close()
            conn.close()
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Не удалось отправить приглашение: {str(e)}'}),
                'isBase64Encoded': False
            }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Приглашение отправлено на email'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }