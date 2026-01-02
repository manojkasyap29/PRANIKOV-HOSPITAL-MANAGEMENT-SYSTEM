package com.example.demo.repository;

import com.example.demo.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, String> {
    List<Conversation> findByUserId(String userId);
    List<Conversation> findByAgentId(String agentId);
    Optional<Conversation> findFirstByCustomerPhoneOrderByCreatedAtDesc(String customerPhone);
    List<Conversation> findByStatus(String status);
}
