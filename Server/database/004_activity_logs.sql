CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NULL,
    action VARCHAR(100) NOT NULL, -- e.g., 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'PROGRESS_UPDATE'
    entity_type VARCHAR(100) NOT NULL, -- e.g., 'INSTALL_PROJECT', 'CUSTOMER', 'USER'
    entity_id VARCHAR(100) NOT NULL, -- The ID of the affected record
    description TEXT NOT NULL, -- Human readable summary of what happened
    details JSON NULL, -- Optional JSON containing old vs new values or other metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
