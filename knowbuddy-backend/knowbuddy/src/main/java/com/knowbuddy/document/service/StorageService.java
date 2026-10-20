package com.knowbuddy.document.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.UUID;

/**
 * Local disk-based file storage service.
 *
 * Stores uploaded files under:
 *   {base-path}/documents/{documentId}/{sanitized-filename}
 *
 * This is the V1 implementation — no AWS dependency required.
 * Designed as a drop-in that can be replaced with an S3 implementation
 * in V2 by simply swapping this bean.
 */
@Slf4j
@Service
public class StorageService {

    @Value("${knowbuddy.storage.local.base-path}")
    private String basePath;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        rootLocation = Paths.get(basePath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootLocation);
           // log.info("Local file storage initialized at: {}", rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not create local storage directory: " + rootLocation, e);
        }
    }

    // ── Upload ────────────────────────────────────────────────────────────────

    /**
     * Saves the file to local disk and returns a storage key (relative path).
     * Storage key format: documents/{documentId}/{sanitized-filename}
     */
    public String upload(MultipartFile file, UUID documentId) {
        String sanitized = sanitize(file.getOriginalFilename());
        String storageKey = "documents/" + documentId + "/" + sanitized;
        Path destination = rootLocation.resolve(storageKey).normalize();

        System.out.println(storageKey);
        
        if (!destination.startsWith(rootLocation)) {
            throw new RuntimeException("Cannot store file outside the storage directory: " + storageKey);
        }

        try {
            Files.createDirectories(destination.getParent());
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            System.out.println(destination.getFileName());
            //log.info("File stored locally: key={}, size={} bytes", storageKey, file.getSize());
            return storageKey;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file locally: " + storageKey, e);
        }
    }

    // ── Download ──────────────────────────────────────────────────────────────

    /**
     * Returns an InputStream for the file at the given storage key.
     */
    public InputStream download(String storageKey) {
        Path filePath = resolveAndValidate(storageKey);
        try {
         //   log.debug("Reading local file: key={}", storageKey);
            return Files.newInputStream(filePath);
        } catch (IOException e) {
        	System.out.println("Failed to read local file: " + storageKey + e);
            throw new RuntimeException("Failed to read local file: " + storageKey, e);
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    /**
     * Deletes the file and its parent directory if empty.
     */
    public void delete(String storageKey) {
        Path filePath = resolveAndValidate(storageKey);
        try {
            Files.deleteIfExists(filePath);
            Path parent = filePath.getParent();
            if (parent != null && Files.isDirectory(parent)) {
                try (var entries = Files.list(parent)) {
                    if (entries.findFirst().isEmpty()) {
                        Files.deleteIfExists(parent);
                    }
                }
            }
           // log.info("Deleted local file: key={}", storageKey);
        } catch (IOException e) {
            //log.warn("Could not delete local file (non-fatal): key={}", storageKey, e);
        }
    }

    // ── Path helper ───────────────────────────────────────────────────────────

    public String resolveAbsolutePath(String storageKey) {
        return resolveAndValidate(storageKey).toString();
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private Path resolveAndValidate(String storageKey) {
        Path resolved = rootLocation.resolve(storageKey).normalize();
        if (!resolved.startsWith(rootLocation)) {
            throw new RuntimeException("Path traversal attempt detected: " + storageKey);
        }
        return resolved;
    }

    private String sanitize(String filename) {
        if (filename == null || filename.isBlank()) return "upload";
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
