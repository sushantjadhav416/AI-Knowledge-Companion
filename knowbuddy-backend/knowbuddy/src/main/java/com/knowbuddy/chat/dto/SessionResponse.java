package com.knowbuddy.chat.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class SessionResponse {
    private UUID id;
    private String title;
    private UUID documentId;
    private String documentName;
    private Integer messageCount;
    private Instant createdAt;
    private Instant updatedAt;
    
    
    
	public SessionResponse(UUID id, String title, UUID documentId, String documentName, Integer messageCount,
			Instant createdAt, Instant updatedAt) {
		super();
		this.id = id;
		this.title = title;
		this.documentId = documentId;
		this.documentName = documentName;
		this.messageCount = messageCount;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
	}
	public UUID getId() {
		return id;
	}
	public void setId(UUID id) {
		this.id = id;
	}
	public String getTitle() {
		return title;
	}
	public void setTitle(String title) {
		this.title = title;
	}
	public UUID getDocumentId() {
		return documentId;
	}
	public void setDocumentId(UUID documentId) {
		this.documentId = documentId;
	}
	public String getDocumentName() {
		return documentName;
	}
	public void setDocumentName(String documentName) {
		this.documentName = documentName;
	}
	public Integer getMessageCount() {
		return messageCount;
	}
	public void setMessageCount(Integer messageCount) {
		this.messageCount = messageCount;
	}
	public Instant getCreatedAt() {
		return createdAt;
	}
	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}
	public Instant getUpdatedAt() {
		return updatedAt;
	}
	public void setUpdatedAt(Instant updatedAt) {
		this.updatedAt = updatedAt;
	}
    
    
    
}
