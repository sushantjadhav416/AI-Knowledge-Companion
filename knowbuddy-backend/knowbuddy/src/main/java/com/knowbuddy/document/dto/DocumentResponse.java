package com.knowbuddy.document.dto;

import com.knowbuddy.document.model.DocumentStatus;
import com.knowbuddy.document.model.FileType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class DocumentResponse {
    private UUID id;
    private String originalName;
    private FileType fileType;
    private Long fileSizeBytes;
    private DocumentStatus status;
    private Integer chunkCount;
    private String summary;
    private List<String> tags;
    private Instant createdAt;
    private Instant updatedAt;
	public UUID getId() {
		return id;
	}
	public void setId(UUID id) {
		this.id = id;
	}
	public String getOriginalName() {
		return originalName;
	}
	public void setOriginalName(String originalName) {
		this.originalName = originalName;
	}
	public FileType getFileType() {
		return fileType;
	}
	public void setFileType(FileType fileType) {
		this.fileType = fileType;
	}
	public Long getFileSizeBytes() {
		return fileSizeBytes;
	}
	public void setFileSizeBytes(Long fileSizeBytes) {
		this.fileSizeBytes = fileSizeBytes;
	}
	public DocumentStatus getStatus() {
		return status;
	}
	public void setStatus(DocumentStatus status) {
		this.status = status;
	}
	public Integer getChunkCount() {
		return chunkCount;
	}
	public void setChunkCount(Integer chunkCount) {
		this.chunkCount = chunkCount;
	}
	public String getSummary() {
		return summary;
	}
	public void setSummary(String summary) {
		this.summary = summary;
	}
	public List<String> getTags() {
		return tags;
	}
	public void setTags(List<String> tags) {
		this.tags = tags;
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
