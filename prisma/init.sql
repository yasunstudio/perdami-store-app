-- Initialize PostgreSQL database for Perdami Store App
-- This script creates the database and user if they don't exist

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE perdami_store_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'perdami_store_db')\gexec

-- Create user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'perdami_user') THEN
        CREATE USER perdami_user WITH PASSWORD 'perdami_password';
    END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE perdami_store_db TO perdami_user;

-- Switch to the database
\c perdami_store_db;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO perdami_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO perdami_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO perdami_user;
