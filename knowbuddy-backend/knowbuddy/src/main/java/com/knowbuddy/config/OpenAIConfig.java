package com.knowbuddy.config;

import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiEmbeddingModel;
import dev.langchain4j.model.openai.OpenAiStreamingChatModel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.time.Duration;

@Slf4j
@Configuration
public class OpenAIConfig {

    @Value("${langchain4j.open-ai.chat-model.api-key}")
    private String apiKey;

    @Value("${langchain4j.open-ai.chat-model.model-name:gpt-4o}")
    private String chatModelName;

    @Value("${langchain4j.open-ai.chat-model.temperature:0.2}")
    private Double temperature;

    @Value("${langchain4j.open-ai.chat-model.max-tokens:2048}")
    private Integer maxTokens;

    @Value("${langchain4j.open-ai.embedding-model.model-name:text-embedding-3-small}")
    private String embeddingModelName;

    // ── Standard (blocking) chat model ───────────────────────────────────────
    @Bean
    @Primary
    public OpenAiChatModel openAiChatModel() {
       // log.info("Initializing OpenAI Chat Model — model={}", chatModelName);
        return OpenAiChatModel.builder()
                .apiKey(apiKey)
                .modelName(chatModelName)
                .temperature(temperature)
                .maxTokens(maxTokens)
                .timeout(Duration.ofSeconds(60))
                .logRequests(false)
                .logResponses(false)
                .build();
    }

    // ── Streaming chat model (for SSE endpoints) ──────────────────────────────
    @Bean
    public OpenAiStreamingChatModel openAiStreamingChatModel() {
       // log.info("Initializing OpenAI Streaming Chat Model — model={}", chatModelName);
        return OpenAiStreamingChatModel.builder()
                .apiKey(apiKey)
                .modelName(chatModelName)
                .temperature(temperature)
                .maxTokens(maxTokens)
                .timeout(Duration.ofSeconds(90))
                .build();
    }

    // ── Embedding model (text-embedding-3-small → 1536 dims) ─────────────────
    @Bean
    public EmbeddingModel embeddingModel() {
       // log.info("Initializing OpenAI Embedding Model — model={}", embeddingModelName);
        return OpenAiEmbeddingModel.builder()
                .apiKey(apiKey)
                .modelName(embeddingModelName)
                .timeout(Duration.ofSeconds(30))
                .build();
    }
}
