CREATE TABLE IF NOT EXISTS party (
    party_id   SERIAL PRIMARY KEY,
    party_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO party (party_name) VALUES
    ('Internal'),
    ('External'),
    ('Partner');