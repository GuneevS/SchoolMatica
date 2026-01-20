-- =============================================================================
-- SchoolMatica Database Initialization
-- Creates necessary extensions and initial configuration
-- =============================================================================

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin";    -- For better GIN indexes

-- Set default timezone for the database
ALTER DATABASE schoolmatica SET timezone TO 'Africa/Johannesburg';

-- Create read-only role for reporting (optional)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'schoolmatica_readonly') THEN
        CREATE ROLE schoolmatica_readonly NOLOGIN;
    END IF;
END
$$;

-- Grant read permissions to readonly role
GRANT USAGE ON SCHEMA public TO schoolmatica_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO schoolmatica_readonly;

-- Create application role with limited permissions (optional, for enhanced security)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'schoolmatica_app') THEN
        CREATE ROLE schoolmatica_app NOLOGIN;
    END IF;
END
$$;

-- Grant necessary permissions to app role
GRANT USAGE ON SCHEMA public TO schoolmatica_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO schoolmatica_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO schoolmatica_app;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'SchoolMatica database initialized successfully';
END
$$;
