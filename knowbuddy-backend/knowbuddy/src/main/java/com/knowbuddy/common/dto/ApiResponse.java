package com.knowbuddy.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;
    private String errorCode;

    @Builder.Default
    private Instant timestamp = Instant.now();

    // ── Factory helpers ──────────────────────────────────────────────────────

    public static <T> ApiResponse<T> ok(T data) {
    	ApiResponse<T> response = new ApiResponse<>();

    	response.setSuccess(true);
    	response.setData(data);

    	return response;
    	
//        return ApiResponse.<T>builder()
//                .success(true)
//                .data(data)
//                .build();
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
    	
    	ApiResponse<T> response = new ApiResponse<>();

    	response.setSuccess(true);
    	response.setMessage(message);
    	response.setData(data);

    	return response;
//        return ApiResponse.<T>builder()
//                .success(true)
//                .message(message)
//                .data(data)
//                .build();
    }

    public static <T> ApiResponse<T> error(String message, String errorCode) {
    	
    	
    	ApiResponse<T> response = new ApiResponse<>();

    	response.setSuccess(false);
    	response.setMessage(message);
        response.setErrorCode(errorCode);
    	return response;
//        return ApiResponse.<T>builder()
//                .success(false)
//                .message(message)
//                .errorCode(errorCode)
//                .build();
    }

	public boolean isSuccess() {
		return success;
	}

	public void setSuccess(boolean success) {
		this.success = success;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public T getData() {
		return data;
	}

	public void setData(T data) {
		this.data = data;
	}

	public String getErrorCode() {
		return errorCode;
	}

	public void setErrorCode(String errorCode) {
		this.errorCode = errorCode;
	}

	public Instant getTimestamp() {
		return timestamp;
	}

	public void setTimestamp(Instant timestamp) {
		this.timestamp = timestamp;
	}
    
    
    
    
}
