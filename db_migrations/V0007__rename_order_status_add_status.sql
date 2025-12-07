ALTER TABLE orders RENAME COLUMN status TO order_status;

ALTER TABLE orders ADD COLUMN status VARCHAR(20) DEFAULT 'active';

CREATE INDEX idx_orders_order_status ON orders(order_status);