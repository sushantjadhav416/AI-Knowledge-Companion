-- =============================================================================
-- KnowBuddy — AstraDB Verification & Debug Queries
-- Run these after uploading a document to confirm data is landing correctly
-- =============================================================================

USE knowbuddy;

-- ── 1. Count total chunks stored ──────────────────────────────────────────────
SELECT COUNT(*) FROM knowbuddy.document_embeddings;
-- Expected: 0 before any upload, N after first document is ingested


-- ── 2. Inspect the first 10 rows (text + metadata, no vector) ─────────────────
SELECT row_id,
       body_blob,
       attributes_blob
FROM   knowbuddy.document_embeddings
LIMIT  10;

-- Expected attributes_blob format (JSON string):
-- {"documentId":"550e8400-e29b-41d4-a716-446655440000",
--  "documentName":"machine_learning.pdf",
--  "pageNumber":"1",
--  "chunkIndex":"0"}


-- ── 3. Find all chunks from a specific document ───────────────────────────────
-- Replace the UUID with a real documentId from your PostgreSQL documents table
SELECT row_id, body_blob, attributes_blob
FROM   knowbuddy.document_embeddings
WHERE  attributes_blob LIKE '%550e8400-e29b-41d4-a716-446655440000%'
LIMIT  50;


-- ── 4. Verify table schema is correct ─────────────────────────────────────────
DESCRIBE TABLE knowbuddy.document_embeddings;

-- Expected output:
-- CREATE TABLE knowbuddy.document_embeddings (
--     row_id uuid PRIMARY KEY,
--     attributes_blob text,
--     body_blob text,
--     vector vector<float, 1536>
-- )


-- ── 5. Verify both indexes exist ───────────────────────────────────────────────
DESCRIBE INDEXES ON knowbuddy.document_embeddings;

-- Expected output (two indexes):
-- document_embeddings_vector_idx     on column: vector     (COSINE, SAI)
-- document_embeddings_attributes_idx on column: attributes_blob (SAI)


-- ── 6. Verify keyspace exists and is configured correctly ─────────────────────
DESCRIBE KEYSPACE knowbuddy;


-- ── 7. Vector dimension check ─────────────────────────────────────────────────
-- If ingestion errors with "vector dimension mismatch",
-- the table was created with a different dimension.
-- Run this and check the vector column type shows VECTOR<FLOAT, 1536>:
SELECT column_name, type
FROM   system_schema.columns
WHERE  keyspace_name = 'knowbuddy'
  AND  table_name    = 'document_embeddings';
