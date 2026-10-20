package com.knowbuddy.search;

import com.knowbuddy.document.repository.DocumentRepository;
import com.knowbuddy.rag.RetrievalService;
import com.knowbuddy.search.dto.SearchRequest;
import com.knowbuddy.search.dto.SearchResult;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Semantic search service — vector similarity search over all ingested documents.
 *
 * Strategy:
 *  1. Embed the query via OpenAI text-embedding-3-small
 *  2. Retrieve top-K matches from AstraDB above score threshold
 *  3. Optionally filter to a specific documentId
 *  4. Return ranked, deduplicated SearchResult list
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SemanticSearchService {

    private final RetrievalService retrievalService;
    private final DocumentRepository documentRepository;
    
    public SemanticSearchService(RetrievalService retrievalService, DocumentRepository documentRepository)
    {    	
    	this.retrievalService = retrievalService;
    	this.documentRepository = documentRepository;
    }

    public List<SearchResult> search(SearchRequest request) {
       // log.info("Semantic search: query='{}', topK={}, minScore={}, docFilter={}",request.getQuery(), request.getTopK(), request.getMinScore(), request.getDocumentId());
        System.out.println("Semantic search: query="+request.getQuery()+", topK="+request.getTopK()+", minScore="+request.getMinScore()+", docFilter="+request.getDocumentId());
        // Retrieve raw matches from AstraDB
        List<EmbeddingMatch<TextSegment>> matches = retrievalService.retrieve(
                request.getQuery(), request.getTopK(), request.getMinScore());

        // Map to SearchResult DTOs
        List<SearchResult> results = matches.stream()
                .map(this::toSearchResult)
                .collect(Collectors.toList());

        // Optional: filter by documentId
        if (request.getDocumentId() != null && !request.getDocumentId().isBlank()) {
            results = results.stream()
                    .filter(r -> request.getDocumentId().equals(r.getDocumentId()))
                    .collect(Collectors.toList());
        }

        // Sort by score descending
        results.sort(Comparator.comparingDouble(SearchResult::getScore).reversed());

        //log.info("Semantic search returned {} results for query='{}'",results.size(), request.getQuery());
          System.out.println("Semantic search returned "+results.size()+" results for query="+request.getQuery());
        return results;
    }

    private SearchResult toSearchResult(EmbeddingMatch<TextSegment> match) {
        TextSegment segment = match.embedded();
        
        SearchResult searchResult = new SearchResult();
        
        searchResult.setChunkText(segment.text());
        searchResult.setScore(match.score());
        searchResult.setDocumentId(segment.metadata().get("documentId"));
        searchResult.setDocumentName(segment.metadata().get("documentName"));
        searchResult.setPageNumber(segment.metadata().get("pageNumber"));
        searchResult.setChunkIndex(segment.metadata().get("chunkIndex"));
        
        return searchResult;
//        return SearchResult.builder()
//                .chunkText(segment.text())
//                .score(match.score())
//                .documentId(segment.metadata().getString("documentId"))
//                .documentName(segment.metadata().getString("documentName"))
//                .pageNumber(segment.metadata().getString("pageNumber"))
//                .chunkIndex(segment.metadata().getString("chunkIndex"))
//                .build();
    }
}
