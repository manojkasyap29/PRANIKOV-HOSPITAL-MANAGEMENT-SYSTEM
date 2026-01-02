package com.example.demo.repository;

import com.example.demo.entity.AssistantRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AssistantRunRepository extends JpaRepository<AssistantRun, String> {
    List<AssistantRun> findByAssistantId(String assistantId);
    List<AssistantRun> findByTask(String task);
}
