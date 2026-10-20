package com.knowbuddy.document.dto;

import com.knowbuddy.document.model.DocumentStatus;
import com.knowbuddy.document.model.FileType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

// ── Upload response ────────────────────────────────────────────────────────
@Data
@Builder
public class DocumentUploadResponse {
    private UUID documentId;
    private String originalName;
    private FileType fileType;
    private Long fileSizeBytes;
    private DocumentStatus status;
    private String message;
	public UUID getDocumentId() {
		return documentId;
	}
	public void setDocumentId(UUID documentId) {
		this.documentId = documentId;
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
	public String getMessage() {
		return message;
	}
	public void setMessage(String message) {
		this.message = message;
	}
    
    
}

