-- =============================================================================
-- KnowBuddy — AstraDB Schema Setup
-- Run this top-to-bottom in the AstraDB CQL Console
-- =============================================================================

-- Step 1: Create keyspace (skip if already created via the dashboard)
CREATE KEYSPACE IF NOT EXISTS knowbuddy
  WITH replication = {
    'class'              : 'NetworkTopologyStrategy',
    'replication_factor' : 1
  }
  AND durable_writes = true;

-- Step 2: Switch to the keyspace
USE knowbuddy;

-- =============================================================================
-- CORE VECTOR TABLE
-- One row per document chunk.
-- LangChain4j's AstraDbEmbeddingStore reads/writes exactly this schema.
--
-- Columns:
--   row_id          → UUID assigned by LangChain4j per chunk (Primary Key)
--   attributes_blob → JSON string carrying metadata injected in IngestionPipeline:
--                     { "documentId": "...", "documentName": "...",
--                       "pageNumber": "1",   "chunkIndex": "0" }
--   body_blob       → Raw chunk text (injected into GPT-4o system prompt)
--   vector          → 1536-dim float[] from OpenAI text-embedding-3-small
-- =============================================================================
CREATE TABLE IF NOT EXISTS knowbuddy.document_embeddings (
    row_id          UUID,
    attributes_blob TEXT,
    body_blob       TEXT,
    vector          VECTOR<FLOAT, 1536>,
    PRIMARY KEY (row_id)
);

-- =============================================================================
-- VECTOR SIMILARITY INDEX
-- Required for cosine ANN (Approximate Nearest Neighbor) search.
-- This is what makes RetrievalService.findRelevant() fast at scale.
-- similarity_function COSINE matches how OpenAI embeddings should be compared.
-- =============================================================================
CREATE CUSTOM INDEX IF NOT EXISTS document_embeddings_vector_idx
  ON knowbuddy.document_embeddings (vector)
  USING 'StorageAttachedIndex'
  WITH OPTIONS = {
    'similarity_function' : 'COSINE'
  };

-- =============================================================================
-- METADATA (ATTRIBUTES) INDEX
-- Allows filtering by metadata fields (documentId, documentName, etc.)
-- during vector retrieval — e.g. "only search within document X".
-- =============================================================================
CREATE CUSTOM INDEX IF NOT EXISTS document_embeddings_attributes_idx
  ON knowbuddy.document_embeddings (attributes_blob)
  USING 'StorageAttachedIndex';

-- =============================================================================
-- VERIFY SETUP
-- Run these to confirm everything was created correctly.
-- =============================================================================
DESCRIBE TABLE knowbuddy.document_embeddings;
DESCRIBE INDEXES ON knowbuddy.document_embeddings;


-----------------------------------------------------------------------------------

# ── KnowBuddy Backend ────────────────────────────────────────────────────────
  knowbuddy-backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: knowbuddy-backend
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      # Database
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: knowbuddy
      DB_USER: knowbuddy
      DB_PASSWORD: knowbuddy
      # OpenAI
      OPENAI_API_KEY: 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
      # AstraDB
      ASTRA_DB_TOKEN: AstraCS:MhsyZpRbzdwbeimsHSunkCee:bbbc7c58de5a1a5c702ce897f069d54b60e0aa30920255e65a69aa2c93839b6e
      ASTRA_DB_ID: 3ed15706-2d45-400c-ac97-b6172eef49fc
      ASTRA_DB_REGION: us-east-2
      ASTRA_DB_KEYSPACE: knowbuddy
      ASTRA_DB_TABLE: document_embeddings
      # Local file storage — mounted volume so files survive restarts
      STORAGE_BASE_PATH: /app/uploads
    ports:
      - "8080:8080"
    volumes:
      - uploads_data:/app/uploads
    restart: unless-stopped