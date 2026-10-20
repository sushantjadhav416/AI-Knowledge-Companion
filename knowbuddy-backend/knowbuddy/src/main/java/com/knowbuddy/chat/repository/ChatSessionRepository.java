package com.knowbuddy.chat.repository;

import com.knowbuddy.chat.model.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, UUID> {

    List<ChatSession> findAllByOrderByUpdatedAtDesc();

    List<ChatSession> findByDocumentIdOrderByUpdatedAtDesc(UUID documentId);
}
