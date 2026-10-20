package com.knowbuddy.document.parser;

import com.knowbuddy.document.dto.ParsedDocument;
import com.knowbuddy.document.model.FileType;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
public class DocxDocumentParser implements DocumentParser {

    @Override
    public boolean supports(FileType fileType) {
        return FileType.DOCX == fileType;
    }

    @Override
    public ParsedDocument parse(InputStream inputStream, String fileName) {
       // log.debug("Parsing DOCX: {}", fileName);

        try (XWPFDocument doc = new XWPFDocument(inputStream);
             XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {

            String fullText = extractor.getText().trim();

            // Approximate "pages" by splitting on double newlines (paragraph groups)
            List<String> paragraphGroups = Arrays.stream(fullText.split("\n\n+"))
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.toList());

            //log.debug("DOCX parsed: {} chars, {} paragraph groups", fullText.length(), paragraphGroups.size());
            
            ParsedDocument parsedDocument = new ParsedDocument();
            
            parsedDocument.setFullText(fullText);
            parsedDocument.setPageTexts(paragraphGroups);
            parsedDocument.setTotalPages(paragraphGroups.size());
            parsedDocument.setFileName(fileName);

            return parsedDocument;


//            return ParsedDocument.builder()
//                    .fullText(fullText)
//                    .pageTexts(paragraphGroups)   // DOCX has no real pages; use paragraph groups
//                    .totalPages(paragraphGroups.size())
//                    .fileName(fileName)
//                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse DOCX: " + fileName, e);
        }
    }
}
