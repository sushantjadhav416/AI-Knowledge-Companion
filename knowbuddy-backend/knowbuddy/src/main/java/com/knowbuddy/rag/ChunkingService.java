package com.knowbuddy.rag;

import com.knowbuddy.document.dto.ParsedDocument;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Splits a ParsedDocument into overlapping text chunks.
 * Each chunk carries page-level provenance metadata.
 */
@Slf4j
@Service
public class ChunkingService {

    @Value("${knowbuddy.rag.chunk-size:512}")
    private int chunkSize;

    @Value("${knowbuddy.rag.chunk-overlap:100}")
    private int chunkOverlap;

    /**
     * Produces a list of RawChunk records from a parsed document.
     * Splitting is page-aware: we keep page boundaries and annotate
     * each chunk with its source page number.
     */
    public List<RawChunk> chunk(ParsedDocument parsed) {
        List<RawChunk> result = new ArrayList<>();
        List<String> pageTexts = parsed.getPageTexts();

        for (int pageIdx = 0; pageIdx < pageTexts.size(); pageIdx++) {
            int pageNumber = pageIdx + 1;
            String pageText = pageTexts.get(pageIdx).trim();

            if (pageText.isBlank()) continue;

            List<String> pageChunks = splitWithOverlap(pageText, chunkSize, chunkOverlap);

            for (int i = 0; i < pageChunks.size(); i++) {
            	
            	RawChunk rawChunk = new RawChunk();
            	rawChunk.setText(pageChunks.get(i));
            	rawChunk.setPageNumber(pageNumber);
            	rawChunk.setChunkIndexWithinPage(i);
            	
                result.add(rawChunk);
            }
        }

       // log.debug("Chunked '{}' into {} chunks (chunkSize={}, overlap={})",parsed.getFileName(), result.size(), chunkSize, chunkOverlap);

        return result;
    }

    // ── Internal split logic ─────────────────────────────────────────────────

    /**
     * Recursive character-level split with overlap.
     * Prefers splitting on paragraph → sentence → word boundaries.
     */
    private List<String> splitWithOverlap(String text, int size, int overlap) {
        List<String> chunks = new ArrayList<>();

        if (text.length() <= size) {
            chunks.add(text);
            return chunks;
        }

        int start = 0;
        while (start < text.length()) {
            int end = Math.min(start + size, text.length());

            // Try to break at paragraph boundary first
            if (end < text.length()) {
                int paraBreak = text.lastIndexOf("\n\n", end);
                if (paraBreak > start + size / 2) {
                    end = paraBreak;
                } else {
                    // Try sentence boundary
                    int sentBreak = lastIndexOfAny(text, new char[]{'.', '!', '?'}, start, end);
                    if (sentBreak > start + size / 2) {
                        end = sentBreak + 1;
                    } else {
                        // Fall back to word boundary
                        int wordBreak = text.lastIndexOf(' ', end);
                        if (wordBreak > start) end = wordBreak;
                    }
                }
            }

            String chunk = text.substring(start, end).trim();
            if (!chunk.isBlank()) {
                chunks.add(chunk);
            }

            // Advance with overlap
            start = Math.max(start + 1, end - overlap);
        }

        return chunks;
    }

    private int lastIndexOfAny(String text, char[] chars, int from, int to) {
        for (int i = Math.min(to, text.length() - 1); i >= from; i--) {
            for (char c : chars) {
                if (text.charAt(i) == c) return i;
            }
        }
        return -1;
    }

    // ── Inner record ─────────────────────────────────────────────────────────

    @lombok.Builder
    @lombok.Data
    public static class RawChunk {
        private String text;
        private int pageNumber;
        private int chunkIndexWithinPage;
		public String getText() {
			return text;
		}
		public void setText(String text) {
			this.text = text;
		}
		public int getPageNumber() {
			return pageNumber;
		}
		public void setPageNumber(int pageNumber) {
			this.pageNumber = pageNumber;
		}
		public int getChunkIndexWithinPage() {
			return chunkIndexWithinPage;
		}
		public void setChunkIndexWithinPage(int chunkIndexWithinPage) {
			this.chunkIndexWithinPage = chunkIndexWithinPage;
		}
        
        
       
    }
}
