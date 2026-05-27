-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for user email lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Urls Table
CREATE TABLE IF NOT EXISTS urls (
    id BIGINT PRIMARY KEY,
    original_url TEXT NOT NULL,
    short_code VARCHAR(10) UNIQUE NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    click_count INT DEFAULT 0
);

-- Indexes for performance on short code, user search, and expiration queries
CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls(user_id);
CREATE INDEX IF NOT EXISTS idx_urls_expires_at ON urls(expires_at);

-- User Clicks Table (Analytics)
CREATE TABLE IF NOT EXISTS user_clicks (
    id BIGSERIAL PRIMARY KEY,
    url_id BIGINT REFERENCES urls(id) ON DELETE CASCADE,
    ip_address VARCHAR(255),
    user_agent TEXT,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for analytics dashboard querying
CREATE INDEX IF NOT EXISTS idx_clicks_url_id ON user_clicks(url_id);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON user_clicks(clicked_at);