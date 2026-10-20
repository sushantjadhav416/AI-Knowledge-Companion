package com.knowbuddy.intelligence;

//import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.log;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.knowbuddy.common.exception.DocumentNotFoundException;
import com.knowbuddy.document.model.Document;
import com.knowbuddy.document.repository.DocumentRepository;
import com.knowbuddy.intelligence.dto.FlashcardDto;
import com.knowbuddy.intelligence.dto.SummaryResponse;
import com.knowbuddy.intelligence.dto.TagsResponse;
import com.knowbuddy.intelligence.model.Flashcard;
import com.knowbuddy.intelligence.repository.FlashcardRepository;

import dev.langchain4j.model.openai.OpenAiChatModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentIntelligenceService {

	private final DocumentRepository documentRepository;
    private final FlashcardRepository flashcardRepository;
    private final OpenAiChatModel chatModel;
    
    public DocumentIntelligenceService(DocumentRepository documentRepository,FlashcardRepository flashcardRepository,OpenAiChatModel chatModel)
    {
    	
		this.documentRepository = documentRepository;
		this.flashcardRepository = flashcardRepository;
		this.chatModel = chatModel;
    }
    

    private ObjectMapper objectMapper = new ObjectMapper();


    @Value("${knowbuddy.intelligence.max-tags:8}")
    private int maxTags;

    @Value("${knowbuddy.intelligence.summary-max-tokens:500}")
    private int summaryMaxTokens;

    @Value("${knowbuddy.intelligence.flashcard-count:10}")
    private int flashcardCount;

    // ── Summarization ─────────────────────────────────────────────────────────

    @Transactional
    public SummaryResponse summarize(UUID documentId) {
        Document doc = getDocument(documentId);
        String textSample = buildTextSample(doc, 6000);

        String prompt = """
                You are a document summarization assistant.
                Summarize the following document in clear, concise prose.
                Focus on: main topics, key findings, and important conclusions.
                Keep the summary under %d words.

                Document: "%s"

                Text:
                %s
                """.formatted(summaryMaxTokens / 2, doc.getOriginalName(), textSample);

       // log.info("Generating summary for document id={}", documentId);
        System.out.println("Generating summary for document id= "+ documentId);
        String summary = chatModel.generate(prompt);

        doc.setSummary(summary);
        documentRepository.save(doc);
        
        SummaryResponse summaryResponse = new SummaryResponse();
        
        summaryResponse.setDocumentId(documentId);
        summaryResponse.setDocumentName(doc.getOriginalName());
        summaryResponse.setSummary(summary);
        
        return summaryResponse;
//
//        return SummaryResponse.builder()
//                .documentId(documentId)
//                .documentName(doc.getOriginalName())
//                .summary(summary)
//                .build();
    }

    // ── Auto-tagging ──────────────────────────────────────────────────────────

    @Transactional
    public TagsResponse generateTags(UUID documentId) {
        Document doc = getDocument(documentId);
        String textSample = buildTextSample(doc, 4000);

        String prompt = """
                You are a document classification assistant.
                Extract up to %d concise topic tags from the document below.
                Return ONLY a valid JSON array of lowercase strings, no explanation.
                Example: ["machine learning", "neural networks", "python", "data science"]

                Document text:
                %s
                """.formatted(maxTags, textSample);

       // log.info("Generating tags for document id={}", documentId);
        System.out.println("Generating tags for document id= "+documentId);
        String rawJson = chatModel.generate(prompt).trim();

        List<String> tags = parseJsonStringList(rawJson);

        doc.setTags(tags.toArray(new String[0]));
        documentRepository.save(doc);

        TagsResponse tagsResponse = new TagsResponse();
        
        tagsResponse.setDocumentId(documentId);
        tagsResponse.setDocumentName(doc.getOriginalName());
        tagsResponse.setTags(tags);

        return tagsResponse;
//        return TagsResponse.builder()
//                .documentId(documentId)
//                .documentName(doc.getOriginalName())
//                .tags(tags)
//                .build();
    }

    // ── Flashcard generation ──────────────────────────────────────────────────

    @Transactional
    public List<FlashcardDto> generateFlashcards(UUID documentId) {
        Document doc = getDocument(documentId);
        String textSample = buildTextSample(doc, 6000);

        String prompt = """
                You are an expert study assistant. Generate exactly %d high-quality flashcards
                from the document text below.

                Return ONLY a valid JSON array. Each element must have:
                  - "question": a clear, specific question
                  - "answer": a concise but complete answer (1-3 sentences)
                  - "difficulty": one of "EASY", "MEDIUM", "HARD"

                Example format:
                [
                  {"question": "What is X?", "answer": "X is ...", "difficulty": "EASY"}
                ]

                Document: "%s"
                Text:
                %s
                """.formatted(flashcardCount, doc.getOriginalName(), textSample);

       // log.info("Generating {} flashcards for document id={}", flashcardCount, documentId);
        String rawJson = chatModel.generate(prompt).trim();

        List<FlashcardDto> flashcardDtos = parseFlashcards(rawJson);

        List<Flashcard> entities = new ArrayList<>();

        for (FlashcardDto dto : flashcardDtos) {

            Flashcard flashcard = new Flashcard();

            flashcard.setDocument(doc);
            flashcard.setQuestion(dto.getQuestion());
            flashcard.setAnswer(dto.getAnswer());
            flashcard.setDifficulty(dto.getDifficulty());

            entities.add(flashcard);
        }
        flashcardRepository.deleteByDocumentId(documentId);  // replace if re-generated
        flashcardRepository.saveAll(entities);

       // log.info("Saved {} flashcards for document id={}", entities.size(), documentId);
        return flashcardDtos;
    }

    public List<FlashcardDto> getFlashcards(UUID documentId) {
    	// Validate document exists
        getDocument(documentId);

        // Fetch flashcards
        List<Flashcard> flashcards =
                flashcardRepository.findByDocumentIdOrderByCreatedAtAsc(documentId);

        // Convert entities to DTOs
        List<FlashcardDto> flashcardDtos = new ArrayList<>();

        for (Flashcard flashcard : flashcards) {
        	
        	FlashcardDto dto = new FlashcardDto();
        	
        	dto.setQuestion(flashcard.getQuestion());
        	dto.setAnswer(flashcard.getAnswer());
        	dto.setDifficulty(flashcard.getDifficulty());
        	
//            FlashcardDto dto = FlashcardDto.builder()
//                    .question(flashcard.getQuestion())
//                    .answer(flashcard.getAnswer())
//                    .difficulty(flashcard.getDifficulty())
//                    .build();

            flashcardDtos.add(dto);
        }

        return flashcardDtos;
    }

    @Transactional
    public void enrichDocument(UUID documentId) {
        //log.info("Running full enrichment (summary + tags) for document id={}", documentId);
        summarize(documentId);
        generateTags(documentId);
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private Document getDocument(UUID id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new DocumentNotFoundException(id.toString()));
    }

    /**
     * Builds a text sample from chunk records stored in PostgreSQL.
     * FIX: Now calls findRawChunksByDocumentId with only one parameter (documentId).
     * Truncation to maxChars is handled here after fetching.
     */
    private String buildTextSample(Document doc, int maxChars) {
        // Reuse existing summary if available (saves API cost)
        if (doc.getSummary() != null && !doc.getSummary().isBlank()) {
            String summary = doc.getSummary();
            return summary.length() > maxChars
                    ? summary.substring(0, maxChars)
                    : summary;
        }

        // FIX: single-param call — maxChars removed from repository method
        String rawText = flashcardRepository.findRawChunksByDocumentId(doc.getId());

        if (rawText == null || rawText.isBlank()) {
            return "No content available for this document yet.";
        }

        // Truncate here instead of in SQL
        return rawText.length() > maxChars
                ? rawText.substring(0, maxChars)
                : rawText;
    }

    private List<String> parseJsonStringList(String json) {
        try {
            String cleaned = json.replaceAll("(?s)```json|```", "").trim();
            return objectMapper.readValue(cleaned, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            //log.warn("Failed to parse tags JSON — returning empty list. Raw: {}", json);
            return List.of();
        }
    }

    private List<FlashcardDto> parseFlashcards(String json) {
        try {
            String cleaned = json.replaceAll("(?s)```json|```", "").trim();
            return objectMapper.readValue(cleaned, new TypeReference<List<FlashcardDto>>() {});
        } catch (Exception e) {
         //   log.warn("Failed to parse flashcards JSON. Raw: {}", json);
            return List.of();
        }
    }
}