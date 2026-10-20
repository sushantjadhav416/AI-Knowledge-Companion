package com.knowbuddy.document.model;

import org.springframework.web.multipart.MultipartFile;

public enum FileType {
    PDF, DOCX, TXT, PPTX, MD;

    public static FileType fromMultipartFile(MultipartFile file) {
        String name = file.getOriginalFilename() != null
                ? file.getOriginalFilename().toLowerCase()
                : "";
        if (name.endsWith(".pdf"))  return PDF;
        if (name.endsWith(".docx")) return DOCX;
        if (name.endsWith(".txt"))  return TXT;
        if (name.endsWith(".pptx")) return PPTX;
        if (name.endsWith(".md"))   return MD;
        throw new IllegalArgumentException("Unsupported file type: " + name);
    }
}
