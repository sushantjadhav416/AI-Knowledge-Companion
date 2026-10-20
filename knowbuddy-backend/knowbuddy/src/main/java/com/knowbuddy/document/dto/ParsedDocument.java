package com.knowbuddy.document.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Internal DTO — carries raw extracted text and per-page content
 * from the parser layer to the RAG ingestion pipeline.
 */
@Data
@Builder
public class ParsedDocument {

    /** Full concatenated text of the document */
    private String fullText;

    /** Per-page text, index 0 = page 1 */
    private List<String> pageTexts;

    /** Total number of pages (1 for plain text files) */
    private int totalPages;

    /** Original file name — passed through for metadata */
    private String fileName;

	public String getFullText() {
		return fullText;
	}

	public void setFullText(String fullText) {
		this.fullText = fullText;
	}

	public List<String> getPageTexts() {
		return pageTexts;
	}

	public void setPageTexts(List<String> pageTexts) {
		this.pageTexts = pageTexts;
	}

	public int getTotalPages() {
		return totalPages;
	}

	public void setTotalPages(int totalPages) {
		this.totalPages = totalPages;
	}

	public String getFileName() {
		return fileName;
	}

	public void setFileName(String fileName) {
		this.fileName = fileName;
	}
    
    
}
