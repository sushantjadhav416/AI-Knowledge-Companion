package com.knowbuddy.config;

import dev.langchain4j.store.embedding.cassandra.AstraDbEmbeddingConfiguration;
import dev.langchain4j.store.embedding.cassandra.AstraDbEmbeddingStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

/**
 * AstraDB vector store configuration.
 *
 * Connected table schema (in keyspace 'knowbuddy'):
 *
 *   CREATE TABLE document_embeddings (
 *       row_id          UUID PRIMARY KEY,
 *       attributes_blob TEXT,          -- JSON metadata per chunk
 *       body_blob       TEXT,          -- raw chunk text
 *       vector          VECTOR<FLOAT, 1536>
 *   );
 *
 * Metadata keys stored in attributes_blob (set by IngestionPipeline):
 *   - documentId   → UUID of the source document (PostgreSQL FK)
 *   - documentName → original filename (for source citations)
 *   - pageNumber   → page the chunk was extracted from
 *   - chunkIndex   → sequential index across the full document
 *
 * Indexes required (must exist before app starts writing):
 *   - document_embeddings_vector_idx     : COSINE SAI on vector column
 *   - document_embeddings_attributes_idx : SAI on attributes_blob column
 *
 * Run scripts/01_setup_keyspace_and_table.cql in the AstraDB CQL Console
 * before starting the application for the first time.
 */
@Slf4j
@Configuration
public class AstraDBConfig {

    @Value("${astradb.token}")
    private String astraToken;

    @Value("${astradb.database-id}")
    private String databaseId;

    @Value("${astradb.region}")
    private String region;

    @Value("${astradb.keyspace:knowbuddy}")
    private String keyspace;

    @Value("${astradb.table:document_embeddings}")
    private String table;

    @Value("${astradb.embedding-dimension:1536}")
    private int embeddingDimension;

    @Bean
    public AstraDbEmbeddingStore astraDbEmbeddingStore() {
        validateConfig();

        log.info("Initializing AstraDB Embedding Store");
        log.info("  database-id : {}", databaseId);
        log.info("  region      : {}", region);
        log.info("  keyspace    : {}", keyspace);
        log.info("  table       : {}", table);
        log.info("  vector dim  : {}", embeddingDimension);

        try {
            AstraDbEmbeddingStore store = new AstraDbEmbeddingStore(
                    AstraDbEmbeddingConfiguration.builder()
                            .token(astraToken)
                            .databaseId(databaseId)
                            .databaseRegion(region)
                            .keyspace(keyspace)
                            .table(table)
                            .dimension(embeddingDimension)
                            .build()
            );

            log.info("AstraDB Embedding Store initialized successfully");
            return store;

        } catch (Exception e) {
            log.error("Failed to initialize AstraDB Embedding Store. " +
                      "Check your ASTRA_DB_TOKEN, ASTRA_DB_ID, and ASTRA_DB_REGION values. " +
                      "Also ensure the keyspace '{}' and table '{}' exist in AstraDB. " +
                      "Run scripts/01_setup_keyspace_and_table.cql in the CQL Console.",
                      keyspace, table, e);
            throw new RuntimeException(
                "AstraDB initialization failed — see logs above for details", e);
        }
    }

    private void validateConfig() {
        if (!StringUtils.hasText(astraToken) || astraToken.equals("${ASTRA_DB_TOKEN}")) {
            throw new IllegalStateException(
                "ASTRA_DB_TOKEN environment variable is not set. " +
                "Generate a token from https://astra.datastax.com → your database → Generate Token.");
        }
        if (!StringUtils.hasText(databaseId) || databaseId.equals("${ASTRA_DB_ID}")) {
            throw new IllegalStateException(
                "ASTRA_DB_ID environment variable is not set. " +
                "Find your Database ID on the AstraDB dashboard overview page.");
        }
        if (embeddingDimension != 1536) {
            log.warn("Non-standard embedding dimension: {}. " +
                     "text-embedding-3-small requires 1536. " +
                     "Ensure astradb.embedding-dimension=1536 in application.properties.", embeddingDimension);
        }
    }
}
