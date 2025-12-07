CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    order_id INTEGER REFERENCES orders(id),
    planned_amount DECIMAL(15, 2),
    planned_amount_percent DECIMAL(5, 2),
    actual_amount DECIMAL(15, 2) DEFAULT 0,
    planned_date DATE,
    actual_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_company_id ON payments(company_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);