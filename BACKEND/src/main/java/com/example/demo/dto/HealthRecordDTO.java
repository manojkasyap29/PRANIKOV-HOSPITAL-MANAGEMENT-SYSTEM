package com.example.demo.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HealthRecordDTO {
    private String id;
    private String patientId;
    private String doctorId;
    private String type;
    private String description;
    private JsonNode attachments;
}
