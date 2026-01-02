package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.databind.JsonNode;

@Entity
@Table(name = "assistant_runs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AssistantRun {
    @Id
    private String id;

    @Column(nullable = false)
    private String assistantId;

    @Column(nullable = false)
    private String task;

    private String status = "completed"; // completed, failed

    @Column(columnDefinition = "json")
    private JsonNode result;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "assistantId", insertable = false, updatable = false)
    private Assistant assistant;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
