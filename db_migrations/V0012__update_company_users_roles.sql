-- Обновление ограничения ролей в company_users
ALTER TABLE company_users DROP CONSTRAINT company_users_role_check;

ALTER TABLE company_users ADD CONSTRAINT company_users_role_check 
CHECK (role IN ('owner', 'admin', 'user', 'viewer'));
