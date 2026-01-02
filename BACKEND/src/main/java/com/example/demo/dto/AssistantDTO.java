package com.example.demo.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AssistantDTO {
    private String id;
    private String name;
    private String description;
    private Boolean enabled;
    private JsonNode skills;
}
