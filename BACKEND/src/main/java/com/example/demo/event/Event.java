package com.example.demo.event;

import java.io.Serializable;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Base event class for all Kafka events
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Event implements Serializable {
    private static final long serialVersionUID = 1L;

    @JsonProperty("event_id")
    private String eventId;

    @JsonProperty("event_type")
    private String eventType;

    @JsonProperty("source")
    private String source;

    @JsonProperty("timestamp")
    private LocalDateTime timestamp;

    @JsonProperty("user_id")
    private String userId;

    @JsonProperty("payload")
    private Object payload;
}
