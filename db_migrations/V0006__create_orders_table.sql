CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    project_id INTEGER REFERENCES projects(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'new',
    payment_status VARCHAR(50) DEFAULT 'not_paid',
    payment_type VARCHAR(50) DEFAULT 'postpaid',
    planned_date DATE,
    actual_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_company_id ON orders(company_id);
CREATE INDEX idx_orders_project_id ON orders(project_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);