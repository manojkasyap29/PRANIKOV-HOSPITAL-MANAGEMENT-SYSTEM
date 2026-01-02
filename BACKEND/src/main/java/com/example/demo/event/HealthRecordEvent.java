package com.example.demo.event;

import java.io.Serializable;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Event published when a health record is created or updated
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class HealthRecordEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    @JsonProperty("record_id")
    private String recordId;

    @JsonProperty("patient_id")
    private String patientId;

    @JsonProperty("doctor_id")
    private String doctorId;

    @JsonProperty("record_type")
    private String recordType;

    @JsonProperty("description")
    private String description;

    @JsonProperty("record_date")
    private LocalDate recordDate;

    @JsonProperty("action")
    private String action; // "created", "updated"
}
