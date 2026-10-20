-- KnowBuddy Core Schema
-- V1: documents, document_chunks, chat_sessions, chat_messages, flashcards

-- ── Documents ────────────────────────────────────────────────────────────────
CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_name   VARCHAR(512)    NOT NULL,
    storage_key     VARCHAR(1024)   NOT NULL,          -- S3 object key
    file_type       VARCHAR(20)     NOT NULL,          -- PDF, DOCX, TXT
    file_size_bytes BIGINT          NOT NULL,
    status          VARCHAR(30)     NOT NULL DEFAULT 'UPLOADING',
    -- UPLOADING | PROCESSING | READY | FAILED
    chunk_count     INTEGER         DEFAULT 0,
    summary         TEXT,
    tags            TEXT[],                            -- auto-generated tags
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_status    ON documents(status);
CREATE INDEX idx_documents_created   ON documents(created_at DESC);
CREATE INDEX idx_documents_tags      ON documents USING GIN(tags);

-- ── Document Chunks (metadata mirror of AstraDB vectors) ──────────────────────
CREATE TABLE document_chunks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id     UUID            NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    vector_id       VARCHAR(512)    NOT NULL UNIQUE,   -- AstraDB vector record ID
    chunk_index     INTEGER         NOT NULL,
    chunk_text      TEXT            NOT NULL,
    page_number     INTEGER,
    token_count     INTEGER,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chunks_document_id  ON document_chunks(document_id);
CREATE INDEX idx_chunks_vector_id    ON document_chunks(vector_id);

-- ── Flashcards ────────────────────────────────────────────────────────────────
CREATE TABLE flashcards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id     UUID            NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    question        TEXT            NOT NULL,
    answer          TEXT            NOT NULL,
    difficulty      VARCHAR(10)     DEFAULT 'MEDIUM',  -- EASY | MEDIUM | HARD
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flashcards_document ON flashcards(document_id);

-- ── Chat Sessions ─────────────────────────────────────────────────────────────
CREATE TABLE chat_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(512),
    document_id     UUID            REFERENCES documents(id) ON DELETE SET NULL,
    -- null = chat across all documents
    message_count   INTEGER         DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_document   ON chat_sessions(document_id);
CREATE INDEX idx_sessions_updated    ON chat_sessions(updated_at DESC);

-- ── Chat Messages ─────────────────────────────────────────────────────────────
CREATE TABLE chat_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID            NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role            VARCHAR(20)     NOT NULL,          -- USER | ASSISTANT | SYSTEM
    content         TEXT            NOT NULL,
    token_count     INTEGER,
    source_chunks   UUID[],                            -- chunk IDs used for this answer
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_messages_created    ON chat_messages(created_at ASC);

-- ── Auto-update updated_at trigger ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
