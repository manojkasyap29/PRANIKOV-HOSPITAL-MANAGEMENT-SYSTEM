package com.example.demo.kafka.consumer;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.example.demo.event.HealthRecordEvent;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class HealthRecordConsumer {

    /**
     * Listen to health record events from the health-records topic
     * Process health record events and perform any downstream actions
     */
    @KafkaListener(
            topics = "${kafka.topic.health-record:health-records}",
            groupId = "health-record-consumer-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumeHealthRecordEvent(HealthRecordEvent event) {
        try {
            log.info("Received health record event: recordId={}, action={}", 
                    event.getRecordId(), event.getAction());

            switch (event.getAction().toLowerCase()) {
                case "created":
                    handleHealthRecordCreated(event);
                    break;
                case "updated":
                    handleHealthRecordUpdated(event);
                    break;
                default:
                    log.warn("Unknown health record action: {}", event.getAction());
            }

            log.info("Successfully processed health record event: {}", event.getRecordId());
        } catch (Exception e) {
            log.error("Error processing health record event: {}", event.getRecordId(), e);
            // Implement DLQ (Dead Letter Queue) handling here if needed
        }
    }

    private void handleHealthRecordCreated(HealthRecordEvent event) {
        log.info("Handling health record creation: recordId={}, patientId={}, recordType={}", 
                event.getRecordId(), event.getPatientId(), event.getRecordType());
        
        // Example: Archive to long-term storage
        // Example: Index for search functionality
        // Example: Trigger related alerts/recommendations
        // Example: Update patient health dashboard
    }

    private void handleHealthRecordUpdated(HealthRecordEvent event) {
        log.info("Handling health record update: recordId={}, patientId={}", 
                event.getRecordId(), event.getPatientId());
        
        // Example: Update search indices
        // Example: Notify relevant medical professionals
        // Example: Update analytics
    }
}
