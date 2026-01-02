package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    private String id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String role; // patient, doctor, admin, agent

    private String phone;

    @Column(nullable = false)
    private Boolean phoneVerified = false;

    private String phoneOtpHash;

    private LocalDateTime phoneOtpExpires;

    private Integer phoneOtpAttempts = 0;

    private LocalDateTime phoneOtpLastSent;

    private LocalDate dateOfBirth;

    @Column(columnDefinition = "TEXT")
    private String address;

    private String imageUrl;

    // Doctor-specific fields
    private String specialization;

    private String license;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
