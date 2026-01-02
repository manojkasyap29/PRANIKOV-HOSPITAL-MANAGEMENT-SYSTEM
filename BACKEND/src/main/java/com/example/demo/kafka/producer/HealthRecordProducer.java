package com.example.demo.kafka.producer;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;

import com.example.demo.event.HealthRecordEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class HealthRecordProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topic.health-record:health-records}")
    private String healthRecordTopic;

    /**
     * Publish a health record event to the Kafka topic
     * @param event the health record event to publish
     */
    public void publishHealthRecordEvent(HealthRecordEvent event) {
        try {
            log.info("Publishing health record event: {}", event.getRecordId());
            
            Message<HealthRecordEvent> message = MessageBuilder
                    .withPayload(event)
                    .setHeader(KafkaHeaders.TOPIC, healthRecordTopic)
                    .build();

            kafkaTemplate.send(message);
            log.info("Successfully published health record event: {}", event.getRecordId());
        } catch (Exception e) {
            log.error("Error publishing health record event: {}", event.getRecordId(), e);
            throw new RuntimeException("Failed to publish health record event", e);
        }
    }
}
