
-- Fix payments with both planned_amount and planned_amount_percent filled
-- Priority is given to percent, so clear planned_amount when percent exists
UPDATE payments 
SET planned_amount = NULL 
WHERE planned_amount_percent IS NOT NULL 
  AND planned_amount IS NOT NULL;
