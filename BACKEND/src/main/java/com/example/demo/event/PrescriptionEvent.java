package com.example.demo.event;

import java.io.Serializable;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Event published when a prescription is created or updated
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PrescriptionEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    @JsonProperty("prescription_id")
    private String prescriptionId;

    @JsonProperty("patient_id")
    private String patientId;

    @JsonProperty("doctor_id")
    private String doctorId;

    @JsonProperty("medication")
    private String medication;

    @JsonProperty("dosage")
    private String dosage;

    @JsonProperty("frequency")
    private String frequency;

    @JsonProperty("start_date")
    private LocalDate startDate;

    @JsonProperty("end_date")
    private LocalDate endDate;

    @JsonProperty("status")
    private String status;

    @JsonProperty("action")
    private String action; // "created", "updated", "cancelled"
}
