#!/bin/bash
set -e

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-postgres}"
PGDATABASE="${PGDATABASE:-dms}"

export PGPASSWORD

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" > /dev/null 2>&1; do
  echo "PostgreSQL not ready yet, retrying in 3s..."
  sleep 3
done
echo "PostgreSQL is ready."

psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" << 'SQL'

-- 1. Rename existing documents table (if it exists and is not already partitioned)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'document'
      AND table_type = 'BASE TABLE'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_partitioned_table pt
    JOIN pg_class pc ON pc.oid = pt.partrelid
    WHERE pc.relname = 'document'
  ) THEN
    ALTER TABLE document RENAME TO documents_old;
    RAISE NOTICE 'Renamed document -> documents_old';
  END IF;
END
$$;

-- 2. Create the partitioned parent table with RANGE partitioning on created_at
CREATE TABLE IF NOT EXISTS document (
  id              BIGSERIAL,
  title           VARCHAR(255),
  description     TEXT,
  status          VARCHAR(50),
  tags            TEXT,
  category_id     BIGINT,
  department_id   BIGINT,
  current_version INTEGER,
  file_name       VARCHAR(255),
  s3_key          VARCHAR(512),
  uploaded_by     BIGINT,
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

ALTER TABLE document ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE document ADD COLUMN IF NOT EXISTS status VARCHAR(50);
ALTER TABLE document ADD COLUMN IF NOT EXISTS tags TEXT;
ALTER TABLE document ADD COLUMN IF NOT EXISTS category_id BIGINT;
ALTER TABLE document ADD COLUMN IF NOT EXISTS department_id BIGINT;
ALTER TABLE document ADD COLUMN IF NOT EXISTS current_version INTEGER;
ALTER TABLE document ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE document ADD COLUMN IF NOT EXISTS s3_key VARCHAR(512);
ALTER TABLE document ADD COLUMN IF NOT EXISTS uploaded_by BIGINT;
ALTER TABLE document ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- 3. Create 4 quarterly child partitions for 2025
CREATE TABLE IF NOT EXISTS document_2025_q1
  PARTITION OF document
  FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

CREATE TABLE IF NOT EXISTS document_2025_q2
  PARTITION OF document
  FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');

CREATE TABLE IF NOT EXISTS document_2025_q3
  PARTITION OF document
  FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');

CREATE TABLE IF NOT EXISTS document_2025_q4
  PARTITION OF document
  FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

-- Default partition to catch rows outside 2025
CREATE TABLE IF NOT EXISTS document_default
  PARTITION OF document DEFAULT;

-- 4. Migrate data from documents_old to the partitioned table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'documents_old'
  ) THEN
    INSERT INTO document (id, title, created_at)
    SELECT id, title, COALESCE(created_at, now()) FROM documents_old
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Migrated data from documents_old to partitioned document table';
  END IF;
END
$$;

-- 5. Verify partition pruning works via EXPLAIN
\echo '--- Partition pruning verification for 2025-02-15 (should hit Q1 only) ---'
EXPLAIN (ANALYZE false, COSTS false, FORMAT TEXT)
  SELECT * FROM document WHERE created_at = '2025-02-15';

\echo '--- Partition pruning verification for 2025-05-20 (should hit Q2 only) ---'
EXPLAIN (ANALYZE false, COSTS false, FORMAT TEXT)
  SELECT * FROM document WHERE created_at = '2025-05-20';

\echo '--- Partition pruning verification for 2025-08-10 (should hit Q3 only) ---'
EXPLAIN (ANALYZE false, COSTS false, FORMAT TEXT)
  SELECT * FROM document WHERE created_at = '2025-08-10';

\echo '--- Partition pruning verification for 2025-11-25 (should hit Q4 only) ---'
EXPLAIN (ANALYZE false, COSTS false, FORMAT TEXT)
  SELECT * FROM document WHERE created_at = '2025-11-25';

SQL

echo "PostgreSQL partitioning initialization complete."
exit 0
