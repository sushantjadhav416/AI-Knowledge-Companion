package com.knowbuddy.rag;

//import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.log;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.knowbuddy.document.dto.ParsedDocument;
import com.knowbuddy.document.model.Document;
import com.knowbuddy.document.model.DocumentChunk;
import com.knowbuddy.document.repository.DocumentChunkRepository;
import com.knowbuddy.document.repository.DocumentRepository;

import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.store.embedding.EmbeddingStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Core RAG ingestion pipeline.
 *
 * Flow:
 *   ParsedDocument
 *     → ChunkingService (split text into RawChunk list)
 *     → EmbeddingService (embed all chunks via OpenAI)
 *     → AstraDbEmbeddingStore (store vectors + metadata)
 *     → DocumentChunkRepository (persist chunk metadata to PostgreSQL)
 *     → DocumentRepository (update status + chunk count)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IngestionPipeline {

    private final ChunkingService chunkingService;
    private final EmbeddingService embeddingService;
    private final EmbeddingStore<TextSegment> embeddingStore;
    private final DocumentChunkRepository chunkRepository;
    private final DocumentRepository documentRepository;
    
   public IngestionPipeline(ChunkingService chunkingServiceObj,EmbeddingService embeddingServiceObj,DocumentChunkRepository chunkRepositoryObj,DocumentRepository documentRepositoryObj,EmbeddingStore<TextSegment> embeddingStore)
   {
	this.chunkingService = chunkingServiceObj;
	this.embeddingService = embeddingServiceObj;
	this.embeddingStore = embeddingStore;
	this.chunkRepository = chunkRepositoryObj;
	this.documentRepository = documentRepositoryObj ;  
   }
   
    

    /**
     * Ingest a parsed document for a given Document entity.
     * Updates document status to PROCESSING → READY (or FAILED).
     *
     * @return number of chunks ingested
     */
    @Transactional
    public int ingest(Document document, ParsedDocument parsed) {
       // log.info("Starting ingestion for document: id={}, name={}",document.getId(), document.getOriginalName());
       System.out.println("Starting ingestion for document ! ");
        document.markProcessing();
        documentRepository.save(document);

        try {
            // 1. Chunk
            List<ChunkingService.RawChunk> rawChunks = chunkingService.chunk(parsed);
            //log.info("Chunked into {} pieces", rawChunks.size());

            // 2. Build TextSegments with metadata for AstraDB
            List<TextSegment> segments = new ArrayList<>();
            for (int i = 0; i < rawChunks.size(); i++) {
                ChunkingService.RawChunk raw = rawChunks.get(i);
                Metadata meta = new Metadata();

                meta.add("documentId", document.getId().toString());
                meta.add("documentName", document.getOriginalName());
                meta.add("pageNumber", String.valueOf(raw.getPageNumber()));
                meta.add("chunkIndex", String.valueOf(i));
                
                
                segments.add(TextSegment.from(raw.getText(), meta));
            }

            // 3. Embed all (batch call to OpenAI)
            List<Embedding> embeddings = embeddingService.embedAll(segments);

            // 4. Store in AstraDB — returns list of assigned vector IDs
            List<String> vectorIds = embeddingStore.addAll(embeddings, segments);
          //  log.info("Stored {} vectors in AstraDB", vectorIds.size());

            // 5. Persist chunk metadata to PostgreSQL
            List<DocumentChunk> chunkEntities = new ArrayList<>();
            for (int i = 0; i < rawChunks.size(); i++) {
                ChunkingService.RawChunk raw = rawChunks.get(i);
                
                DocumentChunk documentChunk = new DocumentChunk();
                documentChunk.setDocument(document);
                documentChunk.setVectorId(vectorIds.get(i));
                documentChunk.setChunkIndex(i);
                documentChunk.setChunkText(raw.getText());
                documentChunk.setPageNumber(raw.getPageNumber());
                documentChunk.setTokenCount(estimateTokenCount(raw.getText()));
                
                chunkEntities.add(documentChunk);
                
//                chunkEntities.add(DocumentChunk.builder()
//                        .document(document)
//                        .vectorId(vectorIds.get(i))
//                        .chunkIndex(i)
//                        .chunkText(raw.getText())
//                        .pageNumber(raw.getPageNumber())
//                        .tokenCount(estimateTokenCount(raw.getText()))
//                        .build());
            }
            chunkRepository.saveAll(chunkEntities);

            // 6. Mark document READY
            document.markReady(rawChunks.size());
            documentRepository.save(document);

           // log.info("Ingestion complete for document id={}: {} chunks stored", document.getId(), rawChunks.size());
            return rawChunks.size();

        } catch (Exception e) {
           // log.error("Ingestion failed for document id={}", document.getId(), e);
            document.markFailed();
            documentRepository.save(document);
            throw new RuntimeException("Ingestion pipeline failed for: " + document.getOriginalName(), e);
        }
    }

    // Rough approximation: 1 token ≈ 4 characters
    private int estimateTokenCount(String text) {
        return text.length() / 4;
    }
}
