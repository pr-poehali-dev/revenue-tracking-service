ALTER TABLE users ADD COLUMN current_company_id INTEGER REFERENCES companies(id);

UPDATE users u
SET current_company_id = (
  SELECT cu.company_id 
  FROM company_users cu 
  WHERE cu.user_id = u.id 
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM company_users cu WHERE cu.user_id = u.id
);