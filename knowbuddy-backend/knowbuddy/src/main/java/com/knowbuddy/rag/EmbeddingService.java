package com.knowbuddy.rag;

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Wraps LangChain4j's EmbeddingModel to produce float[] vectors
 * from text, with batch support.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmbeddingService {

    private final EmbeddingModel embeddingModel;
    
    public EmbeddingService(EmbeddingModel embeddingModel)
    {
		this.embeddingModel = embeddingModel;
    }
    
    
    /**
     * Embed a single string. Returns a float[] vector.
     */
    public float[] embed(String text) {
        Response<Embedding> response = embeddingModel.embed(text);
        return response.content().vector();
    }

    /**
     * Embed a list of TextSegments in batch.
     * LangChain4j handles batching internally per provider limits.
     */
    public List<Embedding> embedAll(List<TextSegment> segments) {
        //log.debug("Embedding {} segments via OpenAI text-embedding-3-small", segments.size());
        Response<List<Embedding>> response = embeddingModel.embedAll(segments);
       // log.debug("Embedding complete — received {} vectors", response.content().size());
        return response.content();
    }

    /**
     * Convenience: embed a list of plain strings.
     */
    public List<Embedding> embedTexts(List<String> texts) {
        List<TextSegment> segments = texts.stream()
                .map(TextSegment::from)
                .collect(Collectors.toList());
        return embedAll(segments);
    }
}
