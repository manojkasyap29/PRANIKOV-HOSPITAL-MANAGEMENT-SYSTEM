package com.example.demo.controller;

import com.example.demo.service.ConversationService;
import com.example.demo.service.TwilioService;
import com.example.demo.entity.Conversation;
import com.example.demo.entity.Message;
import com.example.demo.repository.ConversationRepository;
import com.example.demo.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TwilioWebhookController {
    private final ConversationService conversationService;
    private final TwilioService twilioService;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    @PostMapping("/twilio/inbound")
    public ResponseEntity<?> handleInboundSMS(
            @RequestParam String From,
            @RequestParam String To,
            @RequestParam String Body) {
        try {
            System.out.println("[Twilio inbound] From=" + From + " To=" + To + " Body=" + Body);

            // Normalize phone
            String fromE164 = twilioService.normalizePhoneE164(From);
            if (fromE164 == null) {
                fromE164 = From;
            }

            // Find or create conversation
            Optional<Conversation> existingConvo = conversationService.findByCustomerPhone(fromE164);
            Conversation conversation;

            if (existingConvo.isPresent()) {
                conversation = existingConvo.get();
            } else {
                conversation = conversationService.createConversation(null, null, fromE164);
            }

            // Add message
            conversationService.addMessage(conversation.getId(), "twilio", "inbound", Body, From, To);

            return new ResponseEntity<>(HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Twilio inbound error: " + e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/messages/send")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, String> request) {
        try {
            String userId = getCurrentUserId();
            String userRole = getCurrentUserRole();

            if (!"admin".equals(userRole)) {
                return new ResponseEntity<>(Map.of("message", "Unauthorized"), HttpStatus.FORBIDDEN);
            }

            String to = request.get("to");
            String body = request.get("body");

            if (to == null || to.isEmpty() || body == null || body.isEmpty()) {
                return new ResponseEntity<>(Map.of("message", "Missing 'to' or 'body'"), HttpStatus.BAD_REQUEST);
            }

            boolean sent = twilioService.sendSmsViaTwilio(to, body);
            if (!sent) {
                return new ResponseEntity<>(Map.of("message", "Failed to send SMS. Check Twilio configuration."), HttpStatus.INTERNAL_SERVER_ERROR);
            }

            // Link to conversation
            String toE164 = twilioService.normalizePhoneE164(to);
            if (toE164 == null) {
                toE164 = to;
            }

            Optional<Conversation> existingConvo = conversationService.findByCustomerPhone(toE164);
            Conversation conversation;

            if (existingConvo.isPresent()) {
                conversation = existingConvo.get();
            } else {
                conversation = conversationService.createConversation(null, userId, toE164);
            }

            conversationService.addMessage(conversation.getId(), "agent", "outbound", body, 
                    System.getenv("TWILIO_PHONE_NUMBER"), to);

            Map<String, String> response = Map.of(
                    "message", "SMS sent",
                    "conversationId", conversation.getId()
            );

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations() {
        try {
            String userId = getCurrentUserId();
            String userRole = getCurrentUserRole();

            List<Conversation> conversations = conversationService.getConversationsByUser(userId, userRole);
            return new ResponseEntity<>(conversations, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/conversations/{id}/assign")
    public ResponseEntity<?> assignConversation(@PathVariable String id, @RequestBody Map<String, String> request) {
        try {
            String userRole = getCurrentUserRole();
            if (!"admin".equals(userRole) && !"agent".equals(userRole)) {
                return new ResponseEntity<>(Map.of("message", "Unauthorized"), HttpStatus.FORBIDDEN);
            }

            String agentId = request.get("agentId");
            if (agentId == null || agentId.isEmpty()) {
                agentId = getCurrentUserId();
            }

            Conversation conversation = conversationService.assignAgent(id, agentId);
            return new ResponseEntity<>(conversation, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<?> getConversationMessages(@PathVariable String id) {
        try {
            String userId = getCurrentUserId();
            String userRole = getCurrentUserRole();

            // Verify access
            Conversation conversation = conversationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Conversation not found"));

            if (!"admin".equals(userRole) && !"agent".equals(userRole) && 
                !conversation.getUserId().equals(userId)) {
                return new ResponseEntity<>(Map.of("message", "Unauthorized"), HttpStatus.FORBIDDEN);
            }

            List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(id);
            return new ResponseEntity<>(messages, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/conversations/{id}/reply")
    public ResponseEntity<?> replyConversation(@PathVariable String id, @RequestBody Map<String, String> request) {
        try {
            String userRole = getCurrentUserRole();
            if (!"admin".equals(userRole) && !"agent".equals(userRole)) {
                return new ResponseEntity<>(Map.of("message", "Unauthorized"), HttpStatus.FORBIDDEN);
            }

            String body = request.get("body");
            if (body == null || body.isEmpty()) {
                return new ResponseEntity<>(Map.of("message", "Message body required"), HttpStatus.BAD_REQUEST);
            }

            Conversation conversation = conversationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Conversation not found"));

            String toPhone = conversation.getCustomerPhone();
            if (toPhone == null || toPhone.isEmpty()) {
                return new ResponseEntity<>(Map.of("message", "Conversation has no customer phone"), HttpStatus.BAD_REQUEST);
            }

            boolean sent = twilioService.sendSmsViaTwilio(toPhone, body);
            if (!sent) {
                return new ResponseEntity<>(Map.of("message", "Failed to send SMS"), HttpStatus.INTERNAL_SERVER_ERROR);
            }

            conversationService.addMessage(id, "agent", "outbound", body, 
                    System.getenv("TWILIO_PHONE_NUMBER"), toPhone);

            return new ResponseEntity<>(Map.of("message", "Sent"), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/agents")
    public ResponseEntity<?> listAgents() {
        try {
            String userRole = getCurrentUserRole();
            if (!"admin".equals(userRole) && !"agent".equals(userRole)) {
                return new ResponseEntity<>(Map.of("message", "Unauthorized"), HttpStatus.FORBIDDEN);
            }

            return new ResponseEntity<>(Map.of("message", "Not implemented"), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    protected String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (String) auth.getPrincipal();
    }

    protected String getCurrentUserRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (String) auth.getDetails();
    }
}
