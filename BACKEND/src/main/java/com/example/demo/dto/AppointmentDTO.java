package com.example.demo.dto;

import lombok.*;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDTO {
    private String id;
    private String patientId;
    private String doctorId;
    private LocalDate date;
    private String time;
    private String patientName;
    private String doctorName;
    private String status;
    private String visitType;
    private String reason;
    private String notes;
}
