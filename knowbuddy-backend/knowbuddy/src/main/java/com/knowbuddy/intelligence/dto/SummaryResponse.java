package com.knowbuddy.intelligence.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data @Builder
public class SummaryResponse {
    private UUID documentId;
    private String documentName;
    private String summary;
    
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
	public String getSummary() {
		return summary;
	}
	public void setSummary(String summary) {
		this.summary = summary;
	}
    
    
    
}
