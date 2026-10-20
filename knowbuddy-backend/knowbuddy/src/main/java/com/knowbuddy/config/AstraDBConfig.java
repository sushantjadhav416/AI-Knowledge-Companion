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
 * NOTE: AstraDbEmbeddingStore automatically creates the table and indexes
 * on FIRST startup only. On subsequent startups it reuses what exists.
 *
 * If you see "Cannot create duplicate index" it means the indexes were
 * created manually via CQL Console AND by the SDK. Fix: drop the manually
 * created indexes via CQL Console — the SDK will manage them from that point.
 *
 * Run in CQL Console to fix:
 *   DROP INDEX IF EXISTS knowbuddy.document_embeddings_vector_idx;
 *   DROP INDEX IF EXISTS knowbuddy.document_embeddings_attributes_idx;
 *   DROP TABLE IF EXISTS knowbuddy.document_embeddings;
 * Then restart the app — SDK recreates everything cleanly.
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

//        log.info("Initializing AstraDB Embedding Store");
//        log.info("  database-id : {}", databaseId);
//        log.info("  region      : {}", region);
//        log.info("  keyspace    : {}", keyspace);
//        log.info("  table       : {}", table);
//        log.info("  vector dim  : {}", embeddingDimension);

        // AstraDbEmbeddingStore handles schema creation internally.
        // It uses IF NOT EXISTS for table creation but NOT for indexes —
        // so we must NOT pre-create indexes manually via CQL Console.
        // Let the SDK own the schema entirely.
        return new AstraDbEmbeddingStore(
                AstraDbEmbeddingConfiguration.builder()
                        .token(astraToken)
                        .databaseId(databaseId)
                        .databaseRegion(region)
                        .keyspace(keyspace)
                        .table(table)
                        .dimension(embeddingDimension)
                        .build()
        );
    }

    private void validateConfig() {
        if (!StringUtils.hasText(astraToken) || astraToken.startsWith("${")) {
            throw new IllegalStateException(
                "ASTRA_DB_TOKEN is not set. " +
                "Generate a token from https://astra.datastax.com → your database → Generate Token.");
        }
        if (!StringUtils.hasText(databaseId) || databaseId.startsWith("${")) {
            throw new IllegalStateException(
                "ASTRA_DB_ID is not set. " +
                "Find your Database ID on the AstraDB dashboard overview page.");
        }
        if (embeddingDimension != 1536) {
          //  log.warn("Non-standard embedding dimension: {}. " +"text-embedding-3-small requires 1536.", embeddingDimension);
        }
    }
}