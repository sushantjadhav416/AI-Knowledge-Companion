package com.knowbuddy.search.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class SearchRequest {

    @NotBlank(message = "Query must not be blank")
    private String query;

    @Min(1) @Max(20)
    private int topK = 5;

    /** Minimum similarity score threshold (0.0 – 1.0) */
    private double minScore = 0.70;

    /** Optional: restrict search to a specific documentId */
    private String documentId;

	public String getQuery() {
		return query;
	}

	public void setQuery(String query) {
		this.query = query;
	}

	public int getTopK() {
		return topK;
	}

	public void setTopK(int topK) {
		this.topK = topK;
	}

	public double getMinScore() {
		return minScore;
	}

	public void setMinScore(double minScore) {
		this.minScore = minScore;
	}

	public String getDocumentId() {
		return documentId;
	}

	public void setDocumentId(String documentId) {
		this.documentId = documentId;
	}
    
    
}
