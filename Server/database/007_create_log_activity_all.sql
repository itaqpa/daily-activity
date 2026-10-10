CREATE TABLE IF NOT EXISTS log_activity_all (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  username VARCHAR(100),
  action VARCHAR(255) NOT NULL,
  module VARCHAR(100),
  description TEXT,
  ip_address VARCHAR(50),
  token_used VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
