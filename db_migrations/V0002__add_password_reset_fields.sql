-- Добавление полей для восстановления пароля
ALTER TABLE users 
ADD COLUMN password_reset_code VARCHAR(4),
ADD COLUMN password_reset_expires_at TIMESTAMP;