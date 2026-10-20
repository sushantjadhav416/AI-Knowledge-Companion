package com.knowbuddy.document.parser;

import com.knowbuddy.document.dto.ParsedDocument;
import com.knowbuddy.document.model.FileType;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class PdfDocumentParser implements DocumentParser {

    @Override
    public boolean supports(FileType fileType) {
        return FileType.PDF == fileType;
    }

    @Override
    public ParsedDocument parse(InputStream inputStream, String fileName) {
       // log.debug("Parsing PDF: {}", fileName);

        try (PDDocument pdfDoc = PDDocument.load(inputStream)) {
            int totalPages = pdfDoc.getNumberOfPages();
            PDFTextStripper stripper = new PDFTextStripper();
            List<String> pageTexts = new ArrayList<>();

            // Extract text per page
            for (int page = 1; page <= totalPages; page++) {
                stripper.setStartPage(page);
                stripper.setEndPage(page);
                String pageText = stripper.getText(pdfDoc).trim();
                pageTexts.add(pageText);
            }

            // Full text = all pages joined
            String fullText = String.join("\n\n", pageTexts);

          //  log.debug("PDF parsed: {} pages, {} chars total", totalPages, fullText.length());
            
            
            ParsedDocument parsedDocument = new ParsedDocument();
            
            parsedDocument.setFullText(fullText);
            parsedDocument.setPageTexts(pageTexts);
            parsedDocument.setTotalPages(totalPages);
            parsedDocument.setFileName(fileName);

            return parsedDocument;


//            return ParsedDocument.builder()
//                    .fullText(fullText)
//                    .pageTexts(pageTexts)
//                    .totalPages(totalPages)
//                    .fileName(fileName)
//                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse PDF: " + fileName, e);
        }
    }
}
