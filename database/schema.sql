-- RecycleShare Authentication Database Schema
-- PostgreSQL 17 (Neon Cloud)
-- Created: 2025-01-20

-- ============================================
-- TABLE: users
-- Stores all user accounts for the RecycleShare platform
-- Supports both standard email/password and Google OAuth authentication
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    -- Primary identifier
    user_id SERIAL PRIMARY KEY,
    
    -- User information
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    
    -- Authentication credentials
    password VARCHAR(255),                    -- Hashed with bcrypt (NULL for Google OAuth users)
    google_id VARCHAR(255) UNIQUE,            -- Google OAuth user ID (NULL for standard users)
    profile_picture VARCHAR(500),             -- Profile image URL from Google
    
    -- Contact & Role
    phone VARCHAR(20) UNIQUE NOT NULL,        -- Required for all users (security verification)
    role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'admin' or 'user'
    
    -- Email verification (OTP system)
    is_verified BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(6),             -- 6-digit OTP code
    verification_code_expires TIMESTAMP,      -- OTP expiration time (5 minutes)
    
    -- Account metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE            -- Soft delete flag
);

-- ============================================
-- INDEXES
-- Optimize query performance
-- ============================================

-- Fast email lookup (login, duplicate check)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Fast Google ID lookup (OAuth login)
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Fast phone lookup (duplicate check)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- ============================================
-- ROLE SYSTEM
-- ============================================
-- 
-- admin: Can manage users and system settings
-- user: Standard user account (default)
--
-- Both roles can:
-- - Add waste items
-- - Claim waste items
-- - View waste locations
-- ============================================

-- ============================================
-- SAMPLE QUERIES (for reference)
-- ============================================

-- Register new standard user:
-- INSERT INTO users (first_name, last_name, email, password, phone, role, is_verified, verification_code, verification_code_expires)
-- VALUES ('John', 'Doe', 'john@example.com', '$2b$10$...', '+905551234567', 'user', false, '123456', NOW() + INTERVAL '5 minutes')
-- RETURNING user_id, email, first_name, last_name, role;

-- Register Google OAuth user:
-- INSERT INTO users (first_name, last_name, email, google_id, profile_picture, phone, role, is_verified)
-- VALUES ('Jane', 'Doe', 'jane@gmail.com', '12345678', 'https://...jpg', '+905559876543', 'user', true)
-- RETURNING user_id, email, first_name, last_name, google_id, profile_picture, role;

-- Verify email with OTP:
-- UPDATE users SET is_verified = true, verification_code = NULL, verification_code_expires = NULL
-- WHERE email = 'john@example.com' AND verification_code = '123456' AND verification_code_expires > NOW();

-- Promote user to admin:
-- UPDATE users SET role = 'admin' WHERE email = 'john@example.com';
