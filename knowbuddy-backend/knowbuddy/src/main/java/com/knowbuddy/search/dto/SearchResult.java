package com.knowbuddy.search.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class SearchResult {

    /** The matched chunk text */
    private String chunkText;

    /** Similarity score from AstraDB (0.0 – 1.0) */
    private double score;

    /** Source document ID */
    private String documentId;

    /** Source document name */
    private String documentName;

    /** Page number within source document */
    private String pageNumber;

    /** Chunk index within source document */
    private String chunkIndex;

	public String getChunkText() {
		return chunkText;
	}

	public void setChunkText(String chunkText) {
		this.chunkText = chunkText;
	}

	public double getScore() {
		return score;
	}

	public void setScore(double score) {
		this.score = score;
	}

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

	public String getChunkIndex() {
		return chunkIndex;
	}

	public void setChunkIndex(String chunkIndex) {
		this.chunkIndex = chunkIndex;
	}
    
}
