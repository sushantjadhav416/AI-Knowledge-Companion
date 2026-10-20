-- =============================================================================
-- KnowBuddy — AstraDB Teardown & Reset
-- USE WITH CAUTION — this deletes ALL vectors permanently.
-- Run this if you need a fresh start or changed embedding dimensions.
-- =============================================================================

USE knowbuddy;

-- Step 1: Drop indexes first (must drop before table)
DROP INDEX IF EXISTS knowbuddy.document_embeddings_vector_idx;
DROP INDEX IF EXISTS knowbuddy.document_embeddings_attributes_idx;

-- Step 2: Drop the table
DROP TABLE IF EXISTS knowbuddy.document_embeddings;

-- Step 3: Recreate everything from 01_setup_keyspace_and_table.cql
-- (paste the CREATE TABLE + CREATE INDEX statements from that file here)

CREATE TABLE IF NOT EXISTS knowbuddy.document_embeddings (
    row_id          UUID,
    attributes_blob TEXT,
    body_blob       TEXT,
    vector          VECTOR<FLOAT, 1536>,
    PRIMARY KEY (row_id)
);

CREATE CUSTOM INDEX IF NOT EXISTS document_embeddings_vector_idx
  ON knowbuddy.document_embeddings (vector)
  USING 'StorageAttachedIndex'
  WITH OPTIONS = { 'similarity_function' : 'COSINE' };

CREATE CUSTOM INDEX IF NOT EXISTS document_embeddings_attributes_idx
  ON knowbuddy.document_embeddings (attributes_blob)
  USING 'StorageAttachedIndex';

-- After this, also truncate the PostgreSQL document_chunks table
-- to keep both stores in sync:
-- (run in your PostgreSQL client, not here)
--   TRUNCATE document_chunks;
--   UPDATE documents SET status = 'UPLOADING', chunk_count = 0;
