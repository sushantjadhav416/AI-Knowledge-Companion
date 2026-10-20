package com.knowbuddy.intelligence;

import com.knowbuddy.common.dto.ApiResponse;
import com.knowbuddy.intelligence.dto.FlashcardDto;
import com.knowbuddy.intelligence.dto.SummaryResponse;
import com.knowbuddy.intelligence.dto.TagsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/v1/documents/{documentId}/intelligence")
@RequiredArgsConstructor
public class IntelligenceController {

    private final DocumentIntelligenceService intelligenceService;
    
    public IntelligenceController(DocumentIntelligenceService intelligenceService2)
    {
		this.intelligenceService = intelligenceService2;
    }

    /**
     * POST /api/v1/documents/{documentId}/intelligence/summarize
     * Generates and persists a summary for the document.
     */
    @PostMapping("/summarize")
    public ResponseEntity<ApiResponse<SummaryResponse>> summarize(
            @PathVariable UUID documentId) {
    	 SummaryResponse response=null;
    	try {
       // log.info("Summarize request for document: {}", documentId);
    	System.out.println("Summarize request for document: "+ documentId);
        response = intelligenceService.summarize(documentId);
        return ResponseEntity.ok(ApiResponse.ok("Summary generated successfully", response));
    	}catch (Exception e) {
			// TODO: handle exception
    		System.out.println("error:"+ e.getMessage());
		}
    	return null;
    }

    /**
     * POST /api/v1/documents/{documentId}/intelligence/tags
     * Auto-generates and persists topic tags for the document.
     */
    @PostMapping("/tags")
    public ResponseEntity<ApiResponse<TagsResponse>> generateTags(
            @PathVariable UUID documentId) {
        //log.info("Tag generation request for document: {}", documentId);
        TagsResponse response = intelligenceService.generateTags(documentId);
        return ResponseEntity.ok(ApiResponse.ok("Tags generated successfully", response));
    }

    /**
     * POST /api/v1/documents/{documentId}/intelligence/flashcards
     * Generates and persists flashcards for the document.
     * If flashcards already exist, replaces them.
     */
    @PostMapping("/flashcards")
    public ResponseEntity<ApiResponse<List<FlashcardDto>>> generateFlashcards(
            @PathVariable UUID documentId) {
       // log.info("Flashcard generation request for document: {}", documentId);
        List<FlashcardDto> flashcards = intelligenceService.generateFlashcards(documentId);
        return ResponseEntity.ok(ApiResponse.ok(
                flashcards.size() + " flashcards generated", flashcards));
    }

    /**
     * GET /api/v1/documents/{documentId}/intelligence/flashcards
     * Returns previously generated flashcards.
     */
    @GetMapping("/flashcards")
    public ResponseEntity<ApiResponse<List<FlashcardDto>>> getFlashcards(
            @PathVariable UUID documentId) {
        List<FlashcardDto> flashcards = intelligenceService.getFlashcards(documentId);
        return ResponseEntity.ok(ApiResponse.ok(flashcards));
    }

    /**
     * POST /api/v1/documents/{documentId}/intelligence/enrich
     * Runs both summarize + tag in a single request.
     * Useful to trigger full enrichment after ingestion completes.
     */
    @PostMapping("/enrich")
    public ResponseEntity<ApiResponse<Void>> enrich(@PathVariable UUID documentId) {
        //log.info("Full enrichment request for document: {}", documentId);
        intelligenceService.enrichDocument(documentId);
        return ResponseEntity.ok(ApiResponse.ok("Document enriched successfully", null));
    }
}
