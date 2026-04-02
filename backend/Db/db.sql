TABLE users (
    id BIGINT PRIMARY KEY,
    email VARCHAR(255),
    created_at TIMESTAMP
);

TABLE urls(
    id BIGINT PRIMARY KEY,
    original_url TEXT,
    short_code VARCHAR(10) UNIQUE,
    user_id BIGINT,
    created_at TIMESTAMP,
    expires_at TIMESTAMP,
    click_count INT

);

TABLE user_clicks(
    id BIGINT PRIMARY KEY,
    url_id BIGINT,
    ip_address VARCHAR(255),
    user_agent TEXT,
    clicked_at TIMESTAMP
);