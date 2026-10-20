package com.knowbuddy.common.exception;

public class DocumentNotFoundException extends KnowBuddyException {
    public DocumentNotFoundException(String documentId) {
        super("Document not found: " + documentId, "DOCUMENT_NOT_FOUND");
    }
}
