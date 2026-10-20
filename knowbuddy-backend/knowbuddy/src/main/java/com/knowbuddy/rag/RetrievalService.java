package com.knowbuddy.rag;

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.EmbeddingStoreIngestor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Retrieves semantically relevant chunks from AstraDB for a user query.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RetrievalService {

    private final EmbeddingStore<TextSegment> embeddingStore;
    private final EmbeddingModel embeddingModel;
    
    public RetrievalService(EmbeddingStore<TextSegment> embeddingStore,EmbeddingModel embeddingModel)
    {
    	this.embeddingStore = embeddingStore;
    	this.embeddingModel = embeddingModel;
    }

    @Value("${knowbuddy.rag.max-results:5}")
    private int maxResults;

    @Value("${knowbuddy.rag.min-score:0.70}")
    private double minScore;

    /**
     * Retrieves the top-N most relevant chunks for the given query.
     *
     * @param query the user's question
     * @return list of matching chunks with scores, filtered by minScore
     */
    public List<EmbeddingMatch<TextSegment>> retrieve(String query) {
        return retrieve(query, maxResults, minScore);
    }

    /**
     * Retrieves chunks with custom result count and score threshold.
     */
    public List<EmbeddingMatch<TextSegment>> retrieve(String query, int topK, double scoreThreshold) {
        //log.debug("Retrieving top {} chunks for query: '{}'", topK, query);

        Embedding queryEmbedding = embeddingModel.embed(query).content();

        List<EmbeddingMatch<TextSegment>> matches = embeddingStore.findRelevant(
                queryEmbedding, topK, scoreThreshold);

       // log.debug("Retrieved {} matches (min score: {})", matches.size(), scoreThreshold);
        return matches;
    }

    /**
     * Retrieves chunks and assembles them into a single context string
     * ready to be injected into the LLM prompt.
     *
     * Each chunk is prefixed with its source document name and page number.
     */
    public String retrieveAsContext(String query) {
        List<EmbeddingMatch<TextSegment>> matches = retrieve(query);

        if (matches.isEmpty()) {
           // log.warn("No relevant chunks found for query: '{}'", query);
            return "No relevant information found in the uploaded documents.";
        }

        return matches.stream()
                .map(match -> {
                    TextSegment segment = match.embedded();
                    String docName = segment.metadata().get("documentName");
                    String page    = segment.metadata().get("pageNumber");
                    String source  = (docName != null ? "[" + docName + " | p." + page + "]" : "[source]");
                    return source + "\n" + segment.text();
                })
                .collect(Collectors.joining("\n\n---\n\n"));
    }

    /**
     * Returns the source document IDs referenced in a set of matches.
     */
    public List<String> extractDocumentIds(List<EmbeddingMatch<TextSegment>> matches) {
        return matches.stream()
                .map(m -> m.embedded().metadata().get("documentId"))
                .distinct()
                .collect(Collectors.toList());
    }
}
