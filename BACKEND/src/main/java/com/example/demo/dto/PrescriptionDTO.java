package com.example.demo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionDTO {
    private String id;
    private String patientId;
    private String doctorId;
    private String medication;
    private String dosage;
    private String frequency;
    private String duration;
    private String notes;
    private Integer refillsRemaining;
}
