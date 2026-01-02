package com.example.demo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {
    private String id;
    private String conversationId;
    private String senderType;
    private String direction;
    private String body;
    private String fromNumber;
    private String toNumber;
}
