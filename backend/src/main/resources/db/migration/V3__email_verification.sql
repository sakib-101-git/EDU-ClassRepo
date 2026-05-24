-- Add email verification flag to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Existing admin accounts are already trusted — mark them verified
UPDATE users SET email_verified = TRUE WHERE role = 'ADMIN';

-- OTP tokens table
CREATE TABLE IF NOT EXISTS otp_tokens (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL,
    otp_code    VARCHAR(6)   NOT NULL,
    expires_at  TIMESTAMPTZ  NOT NULL,
    used        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_tokens(email);
