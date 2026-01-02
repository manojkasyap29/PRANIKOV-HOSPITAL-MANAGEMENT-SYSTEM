package com.example.demo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDTO {
    private String id;
    private String userId;
    private String agentId;
    private String status;
    private String source;
    private String subject;
    private String customerPhone;
}
