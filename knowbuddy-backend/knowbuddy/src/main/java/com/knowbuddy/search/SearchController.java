package com.knowbuddy.search;

import com.knowbuddy.common.dto.ApiResponse;
import com.knowbuddy.search.dto.SearchRequest;
import com.knowbuddy.search.dto.SearchResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/v1/search")
@RequiredArgsConstructor
public class SearchController {

    private SemanticSearchService searchService;
    
    public SearchController(SemanticSearchService searchService)
    {
    	this.searchService = searchService;
    }

    /**
     * POST /api/v1/search
     *
     * Body:
     * {
     *   "query": "What is gradient descent?",
     *   "topK": 5,
     *   "minScore": 0.70,
     *   "documentId": "optional-uuid-to-scope-search"
     * }
     */
    @PostMapping
    public ResponseEntity<ApiResponse<List<SearchResult>>> search(
            @Valid @RequestBody SearchRequest request) {
        List<SearchResult> results = searchService.search(request);
        return ResponseEntity.ok(ApiResponse.ok(
                results.size() + " result(s) found", results));
    }

    /**
     * GET /api/v1/search?q=your+question&topK=5
     * Convenience GET endpoint for quick queries.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SearchResult>>> searchGet(
            @RequestParam String q,
            @RequestParam(defaultValue = "5") int topK,
            @RequestParam(defaultValue = "0.70") double minScore,
            @RequestParam(required = false) String documentId) {

        SearchRequest request = new SearchRequest();
        request.setQuery(q);
        request.setTopK(topK);
        request.setMinScore(minScore);
        request.setDocumentId(documentId);

        List<SearchResult> results = searchService.search(request);
        return ResponseEntity.ok(ApiResponse.ok(
                results.size() + " result(s) found", results));
    }
}
