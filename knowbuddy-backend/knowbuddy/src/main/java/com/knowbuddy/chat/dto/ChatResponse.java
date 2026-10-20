package com.knowbuddy.chat.dto;

import com.knowbuddy.chat.model.MessageRole;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

// ── Single chat turn response ─────────────────────────────────────────────────
@Data
@Builder
public class ChatResponse {
    private UUID messageId;
    private UUID sessionId;
    private String answer;
    private List<SourceReference> sources;
    private Instant timestamp;

    @Data
    @Builder
    public static class SourceReference {
        private String documentId;
        private String documentName;
        private String pageNumber;
        private double score;
		public String getDocumentId() {
			return documentId;
		}
		public void setDocumentId(String documentId) {
			this.documentId = documentId;
		}
		public String getDocumentName() {
			return documentName;
		}
		public void setDocumentName(String documentName) {
			this.documentName = documentName;
		}
		public String getPageNumber() {
			return pageNumber;
		}
		public void setPageNumber(String pageNumber) {
			this.pageNumber = pageNumber;
		}
		public double getScore() {
			return score;
		}
		public void setScore(double score) {
			this.score = score;
		}
        
        
        
    }

	public UUID getMessageId() {
		return messageId;
	}

	public void setMessageId(UUID messageId) {
		this.messageId = messageId;
	}

	public UUID getSessionId() {
		return sessionId;
	}

	public void setSessionId(UUID sessionId) {
		this.sessionId = sessionId;
	}

	public String getAnswer() {
		return answer;
	}

	public void setAnswer(String answer) {
		this.answer = answer;
	}

	public List<SourceReference> getSources() {
		return sources;
	}

	public void setSources(List<SourceReference> sources) {
		this.sources = sources;
	}

	public Instant getTimestamp() {
		return timestamp;
	}

	public void setTimestamp(Instant timestamp) {
		this.timestamp = timestamp;
	}
    
    
}
