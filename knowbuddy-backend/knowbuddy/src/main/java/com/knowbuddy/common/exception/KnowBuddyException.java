package com.knowbuddy.common.exception;

// ── Base ─────────────────────────────────────────────────────────────────────
public class KnowBuddyException extends RuntimeException {
    private final String errorCode;

    public KnowBuddyException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() { return errorCode; }
}
