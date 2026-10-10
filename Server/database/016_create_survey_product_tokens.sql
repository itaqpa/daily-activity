CREATE TABLE IF NOT EXISTS survey_product_tokens (
    id SERIAL PRIMARY KEY,
    survey_id INT NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(255),
    role VARCHAR(50),
    token VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(survey_id, user_id)
);
