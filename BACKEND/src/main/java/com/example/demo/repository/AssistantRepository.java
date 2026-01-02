package com.example.demo.repository;

import com.example.demo.entity.Assistant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AssistantRepository extends JpaRepository<Assistant, String> {
    List<Assistant> findByEnabled(Boolean enabled);
}
