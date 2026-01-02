package com.example.demo.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;  // Import for SqlTypes

import java.time.LocalDateTime;

@Entity
@Table(name = "assistants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Assistant {
    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Boolean enabled = true;

    // FIXED: Added @JdbcTypeCode and updated columnDefinition
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")  // Use "jsonb" for PostgreSQL (recommended), or "json" for MySQL
    private JsonNode skills;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}