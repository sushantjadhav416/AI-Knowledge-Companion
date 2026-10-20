package com.knowbuddy.chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.UUID;

@Data
public class ChatRequest {

    @NotBlank(message = "Question must not be blank")
    private String question;

    /** Session ID — if null, a new session is created automatically */
    private UUID sessionId;

    /** Optional: scope this chat to a specific document */
    private UUID documentId;

	public String getQuestion() {
		return question;
	}

	public void setQuestion(String question) {
		this.question = question;
	}

	public UUID getSessionId() {
		return sessionId;
	}

	public void setSessionId(UUID sessionId) {
		this.sessionId = sessionId;
	}

	public UUID getDocumentId() {
		return documentId;
	}

	public void setDocumentId(UUID documentId) {
		this.documentId = documentId;
	}
    
    
}
