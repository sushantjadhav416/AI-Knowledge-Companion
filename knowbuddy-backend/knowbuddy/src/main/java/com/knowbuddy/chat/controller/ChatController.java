package com.knowbuddy.chat.controller;

import com.knowbuddy.chat.dto.*;
import com.knowbuddy.chat.service.ChatService;
import com.knowbuddy.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    
    public ChatController(ChatService chatService)
    {
		this.chatService = chatService;
    }

    // ── Sessions ──────────────────────────────────────────────────────────────

    /**
     * POST /api/v1/chat/sessions
     * Create a new chat session, optionally scoped to a document.
     *
     * Body (optional): { "documentId": "uuid", "title": "My Chat" }
     */
    @PostMapping("/sessions")
    public ResponseEntity<ApiResponse<SessionResponse>> createSession(
            @RequestParam(required = false) UUID documentId,
            @RequestParam(required = false) String title) {
        SessionResponse session = chatService.createSession(documentId, title);
        return ResponseEntity.ok(ApiResponse.ok("Session created", session));
    }

    /**
     * GET /api/v1/chat/sessions
     * List all chat sessions, newest first.
     */
    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> listSessions() {
        return ResponseEntity.ok(ApiResponse.ok(chatService.getAllSessions()));
    }

    /**
     * GET /api/v1/chat/sessions?documentId=uuid
     * List sessions for a specific document.
     */
    @GetMapping(value = "/sessions", params = "documentId")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> listSessionsByDocument(
            @RequestParam UUID documentId) {
        return ResponseEntity.ok(ApiResponse.ok(
                chatService.getSessionsByDocument(documentId)));
    }

    /**
     * GET /api/v1/chat/sessions/{sessionId}/history
     * Returns all messages in a session (oldest first).
     */
    @GetMapping("/sessions/{sessionId}/history")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getHistory(
            @PathVariable UUID sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(
                chatService.getSessionHistory(sessionId)));
    }

    /**
     * DELETE /api/v1/chat/sessions/{sessionId}
     */
    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<Void>> deleteSession(@PathVariable UUID sessionId) {
        chatService.deleteSession(sessionId);
        return ResponseEntity.ok(ApiResponse.ok("Session deleted", null));
    }

    // ── Chat (blocking) ───────────────────────────────────────────────────────

    /**
     * POST /api/v1/chat
     * Standard blocking RAG chat. Returns full answer + source references.
     *
     * Body:
     * {
     *   "question": "What is the main topic of this document?",
     *   "sessionId": "optional-uuid",
     *   "documentId": "optional-uuid"
     * }
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ChatResponse>> chat(
            @Valid @RequestBody ChatRequest request) {
        
//.info("Chat request: sessionId={}, question='{}'",request.getSessionId(), request.getQuestion());
        ChatResponse response = chatService.chat(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ── Chat (streaming SSE) ──────────────────────────────────────────────────

    /**
     * POST /api/v1/chat/stream
     * Streaming RAG chat via Server-Sent Events.
     *
     * The client receives:
     *   - Multiple `data:` events with token chunks
     *   - A final `event:sources` event with source references
     *   - A final `event:done` event with the sessionId
     *
     * Body: same as /chat
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatStream(@Valid @RequestBody ChatRequest request) {
        //log.info("Streaming chat request: sessionId={}, question='{}'",request.getSessionId(), request.getQuestion());
        return chatService.chatStream(request);
    }
}
