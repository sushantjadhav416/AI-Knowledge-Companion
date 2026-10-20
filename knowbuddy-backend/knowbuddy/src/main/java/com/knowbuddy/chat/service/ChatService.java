package com.knowbuddy.chat.service;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.logging.Logger;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.knowbuddy.chat.dto.ChatRequest;
import com.knowbuddy.chat.dto.ChatResponse;
import com.knowbuddy.chat.dto.MessageResponse;
import com.knowbuddy.chat.dto.SessionResponse;
import com.knowbuddy.chat.model.ChatMessage;
import com.knowbuddy.chat.model.ChatSession;
import com.knowbuddy.chat.model.MessageRole;
import com.knowbuddy.chat.repository.ChatMessageRepository;
import com.knowbuddy.chat.repository.ChatSessionRepository;
import com.knowbuddy.common.exception.KnowBuddyException;
import com.knowbuddy.document.model.Document;
import com.knowbuddy.document.repository.DocumentRepository;
import com.knowbuddy.rag.RetrievalService;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiStreamingChatModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final DocumentRepository documentRepository;
    private final RetrievalService retrievalService;
    private final OpenAiChatModel chatModel;
    private final OpenAiStreamingChatModel streamingChatModel;
    
  
    public ChatService(ChatSessionRepository sessionRepository, ChatMessageRepository messageRepository,DocumentRepository documentRepository,RetrievalService retrievalService,OpenAiChatModel chatModelObj,OpenAiStreamingChatModel streamingChatModelObj)
    {
		this.sessionRepository = sessionRepository;
		this.messageRepository = messageRepository;
		this.documentRepository = documentRepository;
		this.retrievalService = retrievalService;
		this.chatModel = chatModelObj;
		this.streamingChatModel = streamingChatModelObj;
    	
    }
    
    
    
    Logger log = Logger.getLogger("ChatService");
    
    private static final int MAX_HISTORY_MESSAGES = 10;

    private static final String SYSTEM_PROMPT = """
            You are KnowBuddy, an intelligent knowledge assistant.
            You help users understand, explore, and learn from their uploaded documents.
            
            Answer questions based ONLY on the provided document context below.
            If the context does not contain enough information to answer confidently,
            say so clearly — do not hallucinate or invent facts.
            
            Always cite your sources by referencing the document name and page number
            when available. Be concise, accurate, and helpful.
            
            Document Context:
            %s
            """;

    // ── Session management ────────────────────────────────────────────────────

    @Transactional
    public SessionResponse createSession(UUID documentId, String title) {
    	ChatSession session = ChatSession.create(title);

        if (documentId != null) {
            Document doc = documentRepository.findById(documentId)
                    .orElseThrow(() -> new KnowBuddyException(
                            "Document not found: " + documentId, "DOCUMENT_NOT_FOUND"));
            session.setDocument(doc);
        }

        session = sessionRepository.save(session);
        //log.info("Created chat session: id={}, documentId={}", session.getId(), documentId);
        return toSessionResponse(session);
    }

    public List<SessionResponse> getAllSessions() {
        return sessionRepository.findAllByOrderByUpdatedAtDesc()
                .stream().map(this::toSessionResponse).collect(Collectors.toList());
    }

    public List<SessionResponse> getSessionsByDocument(UUID documentId) {
        return sessionRepository.findByDocumentIdOrderByUpdatedAtDesc(documentId)
                .stream().map(this::toSessionResponse).collect(Collectors.toList());
    }

    public List<MessageResponse> getSessionHistory(UUID sessionId) {
        return messageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId)
                .stream().map(this::toMessageResponse).collect(Collectors.toList());
    }

    @Transactional
    public void deleteSession(UUID sessionId) {
        sessionRepository.deleteById(sessionId);
        log.info("Deleted chat session: {}"+sessionId);
    }

    // ── Core chat (blocking) ──────────────────────────────────────────────────

    @Transactional
    public ChatResponse chat(ChatRequest request) {
        // 1. Resolve or create session
        ChatSession session = resolveSession(request);

        // 2. Retrieve relevant chunks
        List<EmbeddingMatch<TextSegment>> matches = retrievalService.retrieve(
                request.getQuestion(), 5, 0.70);

        String context = buildContext(matches);

        // 3. Build message list for GPT-4o (system + history + current question)
        List<dev.langchain4j.data.message.ChatMessage> messages = buildMessages(
                session, context, request.getQuestion());

        // 4. Call GPT-4o
        log.info("Calling GPT-4o for session={}, question='{}'"+session.getId()+" "+request.getQuestion());
        Response<AiMessage> response = chatModel.generate(messages);
        String answer = response.content().text();

        // 5. Persist user + assistant messages
        persistMessage(session, MessageRole.USER, request.getQuestion(), null);
        ChatMessage assistantMsg = persistMessage(session, MessageRole.ASSISTANT, answer,
                response.tokenUsage() != null ? response.tokenUsage().outputTokenCount() : null);

        // 6. Build source references
        List<ChatResponse.SourceReference> sources = buildSources(matches);

        // 7. Auto-title session on first message
        if (session.getMessageCount() <= 2 && session.getTitle().equals("New Chat")) {
            session.setTitle(truncate(request.getQuestion(), 60));
            sessionRepository.save(session);
        }
        
        
        ChatResponse chatResponse = new ChatResponse();
        chatResponse.setMessageId(assistantMsg.getId());
        chatResponse.setSessionId(session.getId());
        chatResponse.setAnswer(answer);
        chatResponse.setSources(sources);
        chatResponse.setTimestamp(Instant.now());
        

        return chatResponse;
    }

    // ── Streaming chat (SSE) ──────────────────────────────────────────────────

    @Transactional
    public SseEmitter chatStream(ChatRequest request) {
        SseEmitter emitter = new SseEmitter(90_000L); // 90-second timeout

        ChatSession session = resolveSession(request);

        List<EmbeddingMatch<TextSegment>> matches = retrievalService.retrieve(
                request.getQuestion(), 5, 0.70);
        String context = buildContext(matches);

        List<dev.langchain4j.data.message.ChatMessage> messages = buildMessages(
                session, context, request.getQuestion());

        // Persist user message immediately
        persistMessage(session, MessageRole.USER, request.getQuestion(), null);

        StringBuilder fullAnswer = new StringBuilder();

        streamingChatModel.generate(messages, new dev.langchain4j.model.StreamingResponseHandler<>() {
            @Override
            public void onNext(String token) {
                fullAnswer.append(token);
                try {
                    emitter.send(SseEmitter.event().data(token));
                } catch (IOException e) {
                    emitter.completeWithError(e);
                }
            }

            @Override
            public void onComplete(Response<AiMessage> response) {
                // Persist completed assistant message
                persistMessage(session, MessageRole.ASSISTANT, fullAnswer.toString(),
                        response.tokenUsage() != null ? response.tokenUsage().outputTokenCount() : null);

                // Send sources as a final SSE event
                List<ChatResponse.SourceReference> sources = buildSources(matches);
                try {
                    emitter.send(SseEmitter.event()
                            .name("sources")
                            .data(sources));
                    emitter.send(SseEmitter.event()
                            .name("done")
                            .data(session.getId()));
                    emitter.complete();
                } catch (IOException e) {
                    emitter.completeWithError(e);
                }
            }

            @Override
            public void onError(Throwable error) {
               // log.er("Streaming error for session={}"+ session.getId()+ error);
                emitter.completeWithError(error);
            }
        });

        return emitter;
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private ChatSession resolveSession(ChatRequest request) {
        if (request.getSessionId() != null) {
            return sessionRepository.findById(request.getSessionId())
                    .orElseThrow(() -> new KnowBuddyException(
                            "Session not found: " + request.getSessionId(), "SESSION_NOT_FOUND"));
        }
        // Auto-create a new session
        SessionResponse created = createSession(request.getDocumentId(), "New Chat");
        return sessionRepository.findById(created.getId()).orElseThrow();
    }

    private List<dev.langchain4j.data.message.ChatMessage> buildMessages(
            ChatSession session, String context, String question) {

        List<dev.langchain4j.data.message.ChatMessage> messages = new ArrayList<>();

        // System prompt with injected context
        messages.add(SystemMessage.from(SYSTEM_PROMPT.formatted(context)));

        // Add conversation history (last N messages)
        List<ChatMessage> history = messageRepository
                .findBySessionIdOrderByCreatedAtAsc(session.getId());

        int startIdx = Math.max(0, history.size() - MAX_HISTORY_MESSAGES);
        for (int i = startIdx; i < history.size(); i++) {
            ChatMessage msg = history.get(i);
            if (msg.getRole() == MessageRole.USER) {
                messages.add(UserMessage.from(msg.getContent()));
            } else if (msg.getRole() == MessageRole.ASSISTANT) {
                messages.add(AiMessage.from(msg.getContent()));
            }
        }

        // Current question
        messages.add(UserMessage.from(question));
        return messages;
    }

    private String buildContext(List<EmbeddingMatch<TextSegment>> matches) {
        if (matches.isEmpty()) return "No relevant context found in uploaded documents.";
        return matches.stream()
                .map(m -> {
                    TextSegment seg = m.embedded();
                    String doc  = seg.metadata().get("documentName");
                    String page = seg.metadata().get("pageNumber");
                    return "[" + doc + " | p." + page + "]\n" + seg.text();
                })
                .collect(Collectors.joining("\n\n---\n\n"));
    }

    private List<ChatResponse.SourceReference> buildSources(
            List<EmbeddingMatch<TextSegment>> matches) {
    	
    	
    	List<ChatResponse.SourceReference> sources = new ArrayList<>();

        for (EmbeddingMatch<TextSegment> match : matches) {

            TextSegment textSegment = match.embedded();

            ChatResponse.SourceReference source =
                    new ChatResponse.SourceReference();

            source.setDocumentId(
                    textSegment.metadata().get("documentId"));

            source.setDocumentName(
                    textSegment.metadata().get("documentName"));

            source.setPageNumber(
                    textSegment.metadata().get("pageNumber"));

            source.setScore(match.score());

            sources.add(source);
        }

        return sources;
    }

    @Transactional
    protected ChatMessage persistMessage(ChatSession session, MessageRole role,
                                         String content, Integer tokenCount) {
    	ChatMessage msg = new ChatMessage();
    	msg.setSession(session);
    	msg.setRole(role);
    	msg.setContent(content);
    	msg.setTokenCount(tokenCount);
    	
        session.incrementMessageCount();
        sessionRepository.save(session);
        return messageRepository.save(msg);
    }

    private String truncate(String text, int maxLen) {
        return text.length() <= maxLen ? text : text.substring(0, maxLen - 3) + "...";
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private SessionResponse toSessionResponse(ChatSession s) {
    	
    	return new SessionResponse(
    	        s.getId(),
    	        s.getTitle(),
    	        s.getDocument() != null ? s.getDocument().getId() : null,
    	        s.getDocument() != null ? s.getDocument().getOriginalName() : null,
    	        s.getMessageCount(),
    	        s.getCreatedAt(),
    	        s.getUpdatedAt()
    	);
    }

    private MessageResponse toMessageResponse(ChatMessage m) {
    	return new MessageResponse(
    	        m.getId(),
    	        m.getRole(),
    	        m.getContent(),
    	        m.getTokenCount(),
    	        m.getCreatedAt()
    	);
    }
}
