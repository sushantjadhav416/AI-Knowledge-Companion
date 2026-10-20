package com.knowbuddy.document.parser;

import com.knowbuddy.document.model.FileType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Resolves the correct DocumentParser implementation for a given FileType.
 * All parsers are auto-wired via Spring's component scanning.
 */
@Component
@RequiredArgsConstructor
public class DocumentParserFactory {

    private final List<DocumentParser> parsers;
    
   public DocumentParserFactory(List<DocumentParser> parsers) {
	this.parsers = parsers;
  }
    
    

    public DocumentParser getParser(FileType fileType) {
        return parsers.stream()
                .filter(p -> p.supports(fileType))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "No parser registered for file type: " + fileType));
    }
}
