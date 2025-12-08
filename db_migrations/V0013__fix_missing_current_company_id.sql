-- Обновление current_company_id для пользователей, у которых оно NULL
UPDATE users u
SET current_company_id = (
    SELECT company_id 
    FROM company_users cu 
    WHERE cu.user_id = u.id 
    LIMIT 1
)
WHERE current_company_id IS NULL
AND EXISTS (SELECT 1 FROM company_users cu WHERE cu.user_id = u.id);