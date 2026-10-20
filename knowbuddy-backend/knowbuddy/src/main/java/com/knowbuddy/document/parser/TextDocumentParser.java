package com.knowbuddy.document.parser;

import com.knowbuddy.document.dto.ParsedDocument;
import com.knowbuddy.document.model.FileType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
public class TextDocumentParser implements DocumentParser {

    @Override
    public boolean supports(FileType fileType) {
        return FileType.TXT == fileType || FileType.MD == fileType;
    }

    @Override
    public ParsedDocument parse(InputStream inputStream, String fileName) {
       // log.debug("Parsing text/markdown file: {}", fileName);

        try {
            String fullText = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8).trim();

            List<String> sections = Arrays.stream(fullText.split("\n\n+"))
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.toList());

           // log.debug("Text parsed: {} chars, {} sections", fullText.length(), sections.size());
            ParsedDocument document = new ParsedDocument();

            document.setFullText(fullText);
            document.setPageTexts(sections);
            document.setTotalPages(sections.size());
            document.setFileName(fileName);

            return document;

//            return ParsedDocument.builder()
//                    .fullText(fullText)
//                    .pageTexts(sections)
//                    .totalPages(sections.size())
//                    .fileName(fileName)
//                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse text file: " + fileName, e);
        }
    }
}
