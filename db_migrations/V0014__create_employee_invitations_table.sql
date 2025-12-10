-- Создание таблицы для хранения приглашений сотрудников
CREATE TABLE IF NOT EXISTS t_p27692930_revenue_tracking_ser.employee_invitations (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    invited_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending'
);

-- Индекс для быстрого поиска по токену
CREATE INDEX IF NOT EXISTS idx_invitation_token ON t_p27692930_revenue_tracking_ser.employee_invitations(invitation_token);

-- Индекс для поиска активных приглашений по email
CREATE INDEX IF NOT EXISTS idx_invitation_email_status ON t_p27692930_revenue_tracking_ser.employee_invitations(email, status);