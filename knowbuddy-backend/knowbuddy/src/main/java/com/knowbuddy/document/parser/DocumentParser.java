
package com.knowbuddy.document.parser;

import com.knowbuddy.document.dto.ParsedDocument;
import com.knowbuddy.document.model.FileType;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

/**
 * Strategy interface for document parsing.
 * Each implementation handles one or more FileTypes.
 */
public interface DocumentParser {

    /**
     * Returns true if this parser can handle the given file type.
     */
    boolean supports(FileType fileType);

    /**
     * Parse the given input stream and return structured text content.
     */
    ParsedDocument parse(InputStream inputStream, String fileName);

    /**
     * Convenience overload — reads directly from a MultipartFile.
     */
    default ParsedDocument parse(MultipartFile file, FileType fileType) {
        try {
            return parse(file.getInputStream(), file.getOriginalFilename());
        } catch (Exception e) {
            throw new RuntimeException("Failed to read uploaded file: " + file.getOriginalFilename(), e);
        }
    }
}
