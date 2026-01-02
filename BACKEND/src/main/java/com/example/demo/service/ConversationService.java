package com.example.demo.service;

import com.example.demo.entity.Conversation;
import com.example.demo.entity.Message;
import com.example.demo.repository.ConversationRepository;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class  ConversationService {
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public Conversation createConversation(String userId, String agentId, String customerPhone) {
        Conversation conversation = new Conversation();
        conversation.setId(UUID.randomUUID().toString());
        conversation.setUserId(userId);
        conversation.setAgentId(agentId);
        conversation.setStatus("open");
        conversation.setSource("sms");
        conversation.setCustomerPhone(customerPhone);
        
        return conversationRepository.save(conversation);
    }

    public Optional<Conversation> findByCustomerPhone(String customerPhone) {
        return conversationRepository.findFirstByCustomerPhoneOrderByCreatedAtDesc(customerPhone);
    }

    public List<Conversation> getConversationsByUser(String userId, String userRole) {
        if ("admin".equals(userRole)) {
            return conversationRepository.findAll();
        } else if ("agent".equals(userRole)) {
            // Agent sees assigned or unassigned conversations
            List<Conversation> assigned = conversationRepository.findByAgentId(userId);
            List<Conversation> unassigned = conversationRepository.findByAgentId(null);
            assigned.addAll(unassigned);
            return assigned;
        } else {
            return conversationRepository.findByUserId(userId);
        }
    }

    public Conversation assignAgent(String conversationId, String agentId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        conversation.setAgentId(agentId);
        return conversationRepository.save(conversation);
    }

    public void deleteConversation(String id) {
        conversationRepository.deleteById(id);
    }

    public Message addMessage(String conversationId, String senderType, String direction, String body, String fromNumber, String toNumber) {
        Message message = new Message();
        message.setId(UUID.randomUUID().toString());
        message.setConversationId(conversationId);
        message.setSenderType(senderType);
        message.setDirection(direction);
        message.setBody(body);
        message.setFromNumber(fromNumber);
        message.setToNumber(toNumber);
        
        return messageRepository.save(message);
    }

    public List<Message> getConversationMessages(String conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }
}
