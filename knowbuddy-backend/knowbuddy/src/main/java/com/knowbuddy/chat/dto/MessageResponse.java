package com.knowbuddy.chat.dto;

import com.knowbuddy.chat.model.MessageRole;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class MessageResponse {
    private UUID id;
    private MessageRole role;
    private String content;
    private Integer tokenCount;
    private Instant createdAt;
    
    
    
	public MessageResponse(UUID id, MessageRole role, String content, Integer tokenCount, Instant createdAt) {
		super();
		this.id = id;
		this.role = role;
		this.content = content;
		this.tokenCount = tokenCount;
		this.createdAt = createdAt;
	}
	public UUID getId() {
		return id;
	}
	public void setId(UUID id) {
		this.id = id;
	}
	public MessageRole getRole() {
		return role;
	}
	public void setRole(MessageRole role) {
		this.role = role;
	}
	public String getContent() {
		return content;
	}
	public void setContent(String content) {
		this.content = content;
	}
	public Integer getTokenCount() {
		return tokenCount;
	}
	public void setTokenCount(Integer tokenCount) {
		this.tokenCount = tokenCount;
	}
	public Instant getCreatedAt() {
		return createdAt;
	}
	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}
    
    
}
