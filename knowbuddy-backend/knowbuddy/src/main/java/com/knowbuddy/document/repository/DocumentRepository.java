package com.knowbuddy.document.repository;

import com.knowbuddy.document.model.Document;
import com.knowbuddy.document.model.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {

    List<Document> findByStatusOrderByCreatedAtDesc(DocumentStatus status);

    List<Document> findAllByOrderByCreatedAtDesc();

    @Query(value = "SELECT * FROM documents WHERE :tag = ANY(tags) ORDER BY created_at DESC",
           nativeQuery = true)
    List<Document> findByTag(@Param("tag") String tag);

    // FIX: LOWER() on both sides instead of ILIKE
    // Hibernate intercepts nativeQuery before PostgreSQL sees it and rejects ILIKE
    @Query(value = "SELECT * FROM documents WHERE LOWER(original_name) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY created_at DESC",
           nativeQuery = true)
    List<Document> searchByName(@Param("keyword") String keyword);
}