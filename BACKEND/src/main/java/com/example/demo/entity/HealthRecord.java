package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.fasterxml.jackson.databind.JsonNode;

@Entity
@Table(name = "health_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HealthRecord {
    @Id
    private String id;

    @Column(nullable = false)
    private String patientId;

    private String doctorId;

    @ManyToOne
    @JoinColumn(name = "patientId", insertable = false, updatable = false)
    private User patient;

    @ManyToOne
    @JoinColumn(name = "doctorId", insertable = false, updatable = false)
    private User doctor;

    private LocalDate date = LocalDate.now();

    @Column(nullable = false)
    private String type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "json")
    private JsonNode attachments;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (date == null) {
            date = LocalDate.now();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
