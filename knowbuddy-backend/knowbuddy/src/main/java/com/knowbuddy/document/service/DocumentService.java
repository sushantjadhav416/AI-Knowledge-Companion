package com.knowbuddy.document.service;

import com.knowbuddy.common.exception.DocumentNotFoundException;
import com.knowbuddy.common.exception.DocumentProcessingException;
import com.knowbuddy.document.dto.DocumentResponse;
import com.knowbuddy.document.dto.DocumentUploadResponse;
import com.knowbuddy.document.dto.ParsedDocument;
import com.knowbuddy.document.model.Document;
import com.knowbuddy.document.model.DocumentStatus;
import com.knowbuddy.document.model.FileType;
import com.knowbuddy.document.parser.DocumentParserFactory;
import com.knowbuddy.document.repository.DocumentChunkRepository;
import com.knowbuddy.document.repository.DocumentRepository;
import com.knowbuddy.rag.IngestionPipeline;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository chunkRepository;
    private final StorageService storageService;
    private final DocumentParserFactory parserFactory;
    private final IngestionPipeline ingestionPipeline;
    
    public DocumentService(DocumentRepository documentRepository,DocumentChunkRepository chunkRepository,IngestionPipeline ingestionPipeline,StorageService storageService,DocumentParserFactory parserFactory)
	{
		this.documentRepository = documentRepository;
		this.chunkRepository = chunkRepository;
		this.ingestionPipeline = ingestionPipeline;
		this.storageService = storageService;
		this.parserFactory = parserFactory;
	}

    private static final List<String> ALLOWED_TYPES = List.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "text/markdown"
    );

    // ── Upload ────────────────────────────────────────────────────────────────

    /**
     * FIX: Split into two separate transactions.
     *
     * Problem: When uploadDocument() and processAsync() share one @Transactional,
     * the Document row hasn't committed to PostgreSQL when the async ingestion
     * tries to insert document_chunks — causing FK violation.
     *
     * Solution:
     *   1. saveDocumentRecord()    → REQUIRES_NEW transaction → commits immediately
     *   2. processAsync()          → @Async, runs AFTER commit, own transaction
     *
     * This guarantees the documents row is committed before document_chunks insert.
     */
    public DocumentUploadResponse uploadDocument(MultipartFile file) {
        validateFile(file);

        FileType fileType = FileType.fromMultipartFile(file);
        UUID documentId = UUID.randomUUID();

        // Step 1: Save document record in its OWN transaction — commits immediately
        Document document = saveDocumentRecord(documentId, file, fileType);

        // Step 2: Upload raw file to S3/local storage
        String storageKey = storageService.upload(file, documentId);
        updateStorageKey(documentId, storageKey);

        // Step 3: Fire async ingestion AFTER both commits above
        processAsync(document, file, fileType);

        //log.info("Document upload initiated: id={}, name={}", documentId, file.getOriginalFilename());
        
        DocumentUploadResponse documentUploadResponse = new DocumentUploadResponse();
        documentUploadResponse.setDocumentId(documentId);
        documentUploadResponse.setOriginalName(file.getOriginalFilename());
        documentUploadResponse.setFileType(fileType);
        documentUploadResponse.setFileSizeBytes(file.getSize());
        documentUploadResponse.setStatus(DocumentStatus.UPLOADING);
        documentUploadResponse.setMessage("Document uploaded. Processing started — poll /api/documents/{id}/status for updates.");
        
        
        System.out.println("Document uploaded. Processing started — poll /api/documents/{id}/status for updates. !!"); 
       
        return documentUploadResponse;
//        return DocumentUploadResponse.builder()
//                .documentId(documentId)
//                .originalName(file.getOriginalFilename())
//                .fileType(fileType)
//                .fileSizeBytes(file.getSize())
//                .status(DocumentStatus.UPLOADING)
//                .message("Document uploaded. Processing started — poll /api/v1/documents/"
//                        + documentId + "/status for updates.")
//                .build();
    }

    /**
     * Saves the initial document record in a REQUIRES_NEW transaction.
     * This ensures it commits to PostgreSQL immediately, before ingestion starts.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Document saveDocumentRecord(UUID documentId, MultipartFile file, FileType fileType) {
        Document document = new Document();
        
        document.setId(documentId);
        document.setOriginalName(file.getOriginalFilename());
        document.setStorageKey("");
        document.setFileType(fileType);
        document.setFileSizeBytes(file.getSize());
        document.setStatus(DocumentStatus.UPLOADING);
        Document saved = documentRepository.save(document);
        //log.debug("Document record saved and committed: id={}", documentId);
        return saved;
    }

    /**
     * Updates the storage key after S3/local upload in a REQUIRES_NEW transaction.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateStorageKey(UUID documentId, String storageKey) {
        documentRepository.findById(documentId).ifPresent(doc -> {
            doc.setStorageKey(storageKey);
            documentRepository.save(doc);
        });
    }

    // ── Async ingestion ───────────────────────────────────────────────────────

    /**
     * Runs in a background thread AFTER the document record has been committed.
     * Has its own transaction via IngestionPipeline.
     *
     * FIX: Takes documentId (not Document entity) to force a fresh DB lookup
     * from the committed row — avoids stale entity / detached entity issues.
     */
    @Async("ingestionExecutor")
    public void processAsync(Document document, MultipartFile file, FileType fileType) {
       // log.info("Starting async ingestion for document id={}", documentId);
         System.out.println("Starting async ingestion for document id= "+ document.getOriginalName());
        try {
            // Fresh lookup from committed DB row
//            Document document = documentRepository.findById(documentId)
//                    .orElseThrow(() -> new RuntimeException("Document not found: " + documentId));

            ParsedDocument parsed = parserFactory.getParser(fileType).parse(file, fileType);
            ingestionPipeline.ingest(document, parsed);

        } catch (Exception e) {
          //  log.error("Async ingestion failed for document id={}", documentId, e);
        	System.out.println("Async ingestion failed for document :"+e.getMessage());
            // Mark as FAILED in its own transactios
            markFailed(document);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(Document document) {
//        documentRepository.findById(document.get).ifPresent(doc -> {
            document.markFailed();
            documentRepository.save(document);
//        });
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    public DocumentResponse getDocument(UUID id) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new DocumentNotFoundException(id.toString()));
        return toResponse(doc);
    }

    public String getStorageKey(UUID id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new DocumentNotFoundException(id.toString()))
                .getStorageKey();
    }

    public List<DocumentResponse> getAllDocuments() {
        return documentRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<DocumentResponse> getDocumentsByStatus(DocumentStatus status) {
        return documentRepository.findByStatusOrderByCreatedAtDesc(status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<DocumentResponse> searchDocuments(String keyword) {
        return documentRepository.searchByName(keyword)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Transactional
    public void deleteDocument(UUID id) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new DocumentNotFoundException(id.toString()));

        storageService.delete(doc.getStorageKey());
        chunkRepository.deleteByDocumentId(id);
        documentRepository.delete(doc);

        //log.info("Document deleted: id={}, name={}", id, doc.getOriginalName());
        System.out.println("Document deleted: id= "+id+", name= "+ doc.getOriginalName());
        
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private DocumentResponse toResponse(Document doc) {
        DocumentResponse documentResponse = new DocumentResponse();
    	
    	documentResponse.setId(doc.getId());
    	documentResponse.setOriginalName(doc.getOriginalName());
    	documentResponse.setFileType(doc.getFileType());
    	documentResponse.setFileSizeBytes(doc.getFileSizeBytes());
    	documentResponse.setStatus(doc.getStatus());
    	documentResponse.setChunkCount(doc.getChunkCount());
    	documentResponse.setSummary(doc.getSummary());
    	documentResponse.setTags(doc.getTags() != null ? Arrays.asList(doc.getTags()) : List.of());
    	documentResponse.setCreatedAt(doc.getCreatedAt());
    	documentResponse.setUpdatedAt(doc.getUpdatedAt());
    	
    	return documentResponse;
//        return DocumentResponse.builder()
//                .id(doc.getId())
//                .originalName(doc.getOriginalName())
//                .fileType(doc.getFileType())
//                .fileSizeBytes(doc.getFileSizeBytes())
//                .status(doc.getStatus())
//                .chunkCount(doc.getChunkCount())
//                .summary(doc.getSummary())
//                .tags(doc.getTags() != null ? Arrays.asList(doc.getTags()) : List.of())
//                .createdAt(doc.getCreatedAt())
//                .updatedAt(doc.getUpdatedAt())
//                .build();
    }

    // ── Validation ────────────────────────────────────────────────────────────

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new DocumentProcessingException("Uploaded file is empty");
        }
        if (file.getSize() > 50 * 1024 * 1024L) {
            throw new DocumentProcessingException("File exceeds 50MB limit");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new DocumentProcessingException(
                    "Unsupported file type: " + contentType
                            + ". Allowed: PDF, DOCX, TXT, MD");
        }
    }
}