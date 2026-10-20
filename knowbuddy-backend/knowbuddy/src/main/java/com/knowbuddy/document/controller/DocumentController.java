package com.knowbuddy.document.controller;

import com.knowbuddy.common.dto.ApiResponse;
import com.knowbuddy.document.dto.DocumentResponse;
import com.knowbuddy.document.dto.DocumentUploadResponse;
import com.knowbuddy.document.model.Document;
import com.knowbuddy.document.model.DocumentStatus;
import com.knowbuddy.document.service.DocumentService;
import com.knowbuddy.document.service.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final  DocumentService documentService;
    private final  StorageService storageService;
    
    public DocumentController(DocumentService documentService,StorageService storageService)
    {
    	this.documentService = documentService;
    	this.storageService = storageService;
    }

    /**
     * POST /api/v1/documents/upload
     * Multipart upload. Returns immediately with UPLOADING status.
     * Ingestion runs async — poll /{id}/status until READY or FAILED.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentUploadResponse>> upload(
            @RequestParam("file") MultipartFile file) {
//        log.info("Upload request: name={}, size={} bytes, type={}",
//                file.getOriginalFilename(), file.getSize(), file.getContentType());
    	System.out.println("Upload request: name={}, size={} bytes, type={}"+
                file.getOriginalFilename()+ file.getSize()+ file.getContentType());
        DocumentUploadResponse response = documentService.uploadDocument(file);
        return ResponseEntity.accepted()
                .body(ApiResponse.ok("Document upload started", response));
    }

    /** GET /api/v1/documents */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> listAll() {
        return ResponseEntity.ok(ApiResponse.ok(documentService.getAllDocuments()));
    }

    /** GET /api/v1/documents/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(documentService.getDocument(id)));
    }

    /**
     * GET /api/v1/documents/{id}/status
     * Lightweight poll endpoint — returns status + chunkCount.
     */
    @GetMapping("/{id}/status")
    public ResponseEntity<ApiResponse<DocumentResponse>> getStatus(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(documentService.getDocument(id)));
    }

    /**
     * GET /api/v1/documents/{id}/download
     * Streams the raw file directly from local disk storage.
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<InputStreamResource> download(@PathVariable UUID id) {
        DocumentResponse doc = documentService.getDocument(id);
        String storageKey    = documentService.getStorageKey(id);
        InputStream stream   = storageService.download(storageKey);

        String contentType = switch (doc.getFileType()) {
            case PDF  -> "application/pdf";
            case DOCX -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case TXT, MD -> "text/plain";
            default   -> "application/octet-stream";
        };

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + doc.getOriginalName() + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(new InputStreamResource(stream));
    }

    /** GET /api/v1/documents/search?q=keyword */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> search(
            @RequestParam("q") String keyword) {
        return ResponseEntity.ok(ApiResponse.ok(documentService.searchDocuments(keyword)));
    }

    /** GET /api/v1/documents?status=READY */
    @GetMapping(params = "status")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> listByStatus(
            @RequestParam DocumentStatus status) {
        return ResponseEntity.ok(ApiResponse.ok(documentService.getDocumentsByStatus(status)));
    }

    /** DELETE /api/v1/documents/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        documentService.deleteDocument(id);
        return ResponseEntity.ok(ApiResponse.ok("Document deleted successfully", null));
    }
}
