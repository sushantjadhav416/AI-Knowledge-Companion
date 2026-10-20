# KnowBuddy — AstraDB Setup Guide

## What AstraDB stores in this project

AstraDB is used exclusively as the **vector store** for the RAG pipeline.

Every uploaded document is parsed → chunked → embedded via OpenAI
`text-embedding-3-small` (1536 dimensions) → stored in AstraDB.

At query time, the user's question is embedded and AstraDB performs
cosine similarity search to find the most relevant chunks.

### AstraDB stores per chunk:
| Field         | Source                                | Example                          |
|---------------|---------------------------------------|----------------------------------|
| `row_id`      | Auto-assigned by LangChain4j          | `a1b2c3d4-...` (UUID)            |
| `attributes_blob` | Serialized metadata (JSON)        | documentId, documentName, etc.   |
| `body_blob`   | Raw chunk text                        | "Gradient descent is a method…"  |
| `vector`      | 1536-dim float[] from OpenAI          | [0.012, -0.034, …]               |

### PostgreSQL mirrors the chunk metadata:
AstraDB holds the vectors. PostgreSQL's `document_chunks` table mirrors
the chunk metadata (text, page, index, vector_id) so the app can query
chunk info without going to AstraDB every time.

---

## Part 1 — Create your AstraDB database

1. Go to https://astra.datastax.com and sign in (or create a free account)
2. Click **"Create Database"**
3. Choose:
   - **Deployment**: Serverless (Vector)  ← important, must be Vector type
   - **Database name**: `knowbuddy`
   - **Keyspace name**: `knowbuddy`
   - **Provider**: AWS / Google Cloud / Azure (any)
   - **Region**: `us-east-2` (or nearest to you)
4. Click **"Create Database"** and wait ~2 minutes for it to become Active

---

## Part 2 — Get your credentials

From the AstraDB dashboard for your `knowbuddy` database:

1. **Database ID** — shown on the database overview page (UUID format)
2. **Region** — shown next to the database name (e.g. `us-east-2`)
3. **Application Token**:
   - Click **"Generate Token"** (top right)
   - Role: **"Database Administrator"**
   - Copy the token — it starts with `AstraCS:`
   - Save it immediately — it is only shown once

Put these in your `.env` file:
```
ASTRA_DB_TOKEN=AstraCS:xxxxxxxxxxxxxxxx...
ASTRA_DB_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ASTRA_DB_REGION=us-east-2
ASTRA_DB_KEYSPACE=knowbuddy
ASTRA_DB_TABLE=document_embeddings
```

---

## Part 3 — Keyspace setup via CQL Console

Open the **CQL Console** tab in your AstraDB dashboard and run:

```cql
-- Verify your keyspace exists (it was created with the database)
DESCRIBE KEYSPACE knowbuddy;

-- Switch to the knowbuddy keyspace
USE knowbuddy;
```

If the keyspace was NOT created automatically (edge case), create it:
```cql
CREATE KEYSPACE IF NOT EXISTS knowbuddy
  WITH replication = {'class': 'NetworkTopologyStrategy', 'replication_factor': 1};
```

---

## Part 4 — Vector table for document embeddings

This is the core table. LangChain4j's `AstraDbEmbeddingStore` creates this
automatically on first use, BUT running this manually first lets you
confirm the schema is exactly right and add the metadata index.

```cql
USE knowbuddy;

-- Main vector table — one row per document chunk
CREATE TABLE IF NOT EXISTS knowbuddy.document_embeddings (
    row_id          UUID,
    attributes_blob TEXT,      -- JSON: documentId, documentName, pageNumber, chunkIndex
    body_blob       TEXT,      -- Raw chunk text (what gets injected into the LLM prompt)
    vector          VECTOR<FLOAT, 1536>,  -- text-embedding-3-small = 1536 dimensions
    PRIMARY KEY     (row_id)
);

-- Vector similarity index (SAI — Storage Attached Index)
-- This is what makes cosine similarity search fast
CREATE CUSTOM INDEX IF NOT EXISTS document_embeddings_vector_idx
  ON knowbuddy.document_embeddings (vector)
  USING 'StorageAttachedIndex'
  WITH OPTIONS = { 'similarity_function': 'COSINE' };

-- SAI index on attributes_blob for metadata filtering
-- Enables filtering by documentId, documentName, etc. during retrieval
CREATE CUSTOM INDEX IF NOT EXISTS document_embeddings_attributes_idx
  ON knowbuddy.document_embeddings (attributes_blob)
  USING 'StorageAttachedIndex';
```

---

## Part 5 — Verify the table was created correctly

```cql
-- Verify table structure
DESCRIBE TABLE knowbuddy.document_embeddings;

-- Verify indexes exist
DESCRIBE INDEXES ON knowbuddy.document_embeddings;

-- Should show:
-- document_embeddings_vector_idx     (VECTOR, COSINE, StorageAttachedIndex)
-- document_embeddings_attributes_idx (attributes_blob, StorageAttachedIndex)
```

---

## Part 6 — Verify LangChain4j connection on app startup

When your Spring Boot application starts, `AstraDBConfig.java` initializes
the `AstraDbEmbeddingStore` bean. Check the logs for:

```
INFO  c.k.config.AstraDBConfig - Initializing AstraDB Embedding Store
      — keyspace=knowbuddy, table=document_embeddings, dim=1536
```

If you see this without errors, AstraDB is connected.

---

## Part 7 — Test with a manual CQL insert + query

After uploading at least one document via the API, verify data landed:

```cql
USE knowbuddy;

-- Count total chunks stored
SELECT COUNT(*) FROM knowbuddy.document_embeddings;

-- View the first 5 rows (metadata + text, no vector for readability)
SELECT row_id, attributes_blob, body_blob
  FROM knowbuddy.document_embeddings
  LIMIT 5;

-- Example attributes_blob value you will see (JSON string):
-- {"documentId":"uuid-here","documentName":"file.pdf","pageNumber":"1","chunkIndex":"0"}
```

---

## Part 8 — Similarity search query (for debugging)

AstraDB uses the `ANN` (Approximate Nearest Neighbor) syntax for vector search.
You won't run this manually in production (the app does it), but it's useful
for debugging retrieval:

```cql
-- This is what RetrievalService.retrieve() does under the hood.
-- Replace [...] with an actual 1536-element float array.
-- In practice, LangChain4j builds this query for you.

SELECT row_id, body_blob, attributes_blob,
       similarity_cosine(vector, [...]) AS score
FROM   knowbuddy.document_embeddings
ORDER  BY vector ANN OF [0.012, -0.034, 0.008, ...]   -- query embedding
LIMIT  5;
```

---

## Part 9 — Drop and recreate (if you need a fresh start)

```cql
USE knowbuddy;

-- Drop the table (deletes ALL vectors — use with caution)
DROP TABLE IF EXISTS knowbuddy.document_embeddings;

-- Recreate (repeat Part 4 above)
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `Connection refused` on startup | Wrong token or database ID | Re-check `.env` values exactly |
| `Keyspace 'knowbuddy' does not exist` | Keyspace not created | Run Part 3 in CQL Console |
| `Invalid vector dimension` error | Table created with wrong dimension | Drop table + recreate with `VECTOR<FLOAT, 1536>` |
| `No relevant chunks found` on chat | Ingestion failed or minScore too high | Check `document_chunks` in PostgreSQL for `vectorId` values; lower `knowbuddy.rag.min-score` |
| Empty `SELECT COUNT(*)` | Ingestion never completed | Check app logs for `IngestionPipeline` errors |
| LangChain4j creates table with wrong name | `astradb.table` property mismatch | Ensure `application.properties` has `astradb.table=document_embeddings` |
