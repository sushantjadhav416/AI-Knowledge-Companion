package com.knowbuddy.common.exception;

public class DocumentProcessingException extends KnowBuddyException {
    public DocumentProcessingException(String message) {
        super(message, "DOCUMENT_PROCESSING_FAILED");
    }
    public DocumentProcessingException(String message, Throwable cause) {
        super(message, "DOCUMENT_PROCESSING_FAILED");
        initCause(cause);
    }
}
