ALTER TABLE clients ADD COLUMN status VARCHAR(20) DEFAULT 'active';

UPDATE clients SET status = 'active' WHERE notes IS NULL OR notes = '';
UPDATE clients SET status = 'removed' WHERE notes = 'REMOVED';