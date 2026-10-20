package com.knowbuddy.intelligence.repository;

import com.knowbuddy.intelligence.model.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, UUID> {

	
    List<Flashcard> findByDocumentIdOrderByCreatedAtAsc(UUID documentId);

    void deleteByDocumentId(UUID documentId);

    /**
     * FIX: Removed unused 'maxChars' parameter — it was in the method signature
     * but had no :maxChars binding in the SQL, causing Spring Data validation to fail.
     *
     * Retrieves raw chunk text for a document concatenated into a single string.
     * LIMIT 30 fetches the first 30 chunks which is sufficient for GPT-4o context.
     * The calling service (DocumentIntelligenceService.buildTextSample) handles
     * further truncation if needed.
     */
    @Query(value = """
            SELECT string_agg(chunk_text, ' ')
            FROM (
                SELECT chunk_text
                FROM document_chunks
                WHERE document_id = :documentId
                ORDER BY chunk_index
                LIMIT 30
            ) sub
            """, nativeQuery = true)
    String findRawChunksByDocumentId(@Param("documentId") UUID documentId);
}