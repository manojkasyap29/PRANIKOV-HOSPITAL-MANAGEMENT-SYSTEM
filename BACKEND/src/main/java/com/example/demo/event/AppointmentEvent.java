package com.example.demo.event;

import java.io.Serializable;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Event published when an appointment is created or updated
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AppointmentEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    @JsonProperty("appointment_id")
    private String appointmentId;

    @JsonProperty("patient_id")
    private String patientId;
    @JsonProperty("patient_name")
    private String patientName;

    @JsonProperty("doctor_id")
    private String doctorId;

    @JsonProperty("doctor_name")
    private String doctorName;

    @JsonProperty("date")
    private LocalDate date;

    @JsonProperty("time")
    private String time;

    @JsonProperty("reason")
    private String reason;

    @JsonProperty("status")
    private String status;

    @JsonProperty("visit_type")
    private String visitType;

    @JsonProperty("action")
    private String action; // "created", "updated", "cancelled", "accepted", "rejected"

    @JsonProperty("rejection_reason")
    private String rejectionReason;
}
