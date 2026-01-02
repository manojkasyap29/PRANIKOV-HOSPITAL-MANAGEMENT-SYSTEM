package com.example.demo.kafka.consumer;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.example.demo.event.PrescriptionEvent;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class PrescriptionConsumer {

    /**
     * Listen to prescription events from the prescriptions topic
     * Process prescription events and perform any downstream actions
     */
    @KafkaListener(
            topics = "${kafka.topic.prescription:prescriptions}",
            groupId = "prescription-consumer-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumePrescriptionEvent(PrescriptionEvent event) {
        try {
            log.info("Received prescription event: prescriptionId={}, action={}", 
                    event.getPrescriptionId(), event.getAction());

            switch (event.getAction().toLowerCase()) {
                case "created":
                    handlePrescriptionCreated(event);
                    break;
                case "updated":
                    handlePrescriptionUpdated(event);
                    break;
                case "cancelled":
                    handlePrescriptionCancelled(event);
                    break;
                default:
                    log.warn("Unknown prescription action: {}", event.getAction());
            }

            log.info("Successfully processed prescription event: {}", event.getPrescriptionId());
        } catch (Exception e) {
            log.error("Error processing prescription event: {}", event.getPrescriptionId(), e);
            // Implement DLQ (Dead Letter Queue) handling here if needed
        }
    }

    private void handlePrescriptionCreated(PrescriptionEvent event) {
        log.info("Handling prescription creation: prescriptionId={}, patientId={}, medication={}", 
                event.getPrescriptionId(), event.getPatientId(), event.getMedication());
        
        // Example: Check drug interactions
        // Example: Notify pharmacy
        // Example: Send notification to patient
        // Example: Create fulfillment requests
    }

    private void handlePrescriptionUpdated(PrescriptionEvent event) {
        log.info("Handling prescription update: prescriptionId={}, newStatus={}", 
                event.getPrescriptionId(), event.getStatus());
        
        // Example: Update pharmacy about changes
        // Example: Notify patient about modifications
    }

    private void handlePrescriptionCancelled(PrescriptionEvent event) {
        log.info("Handling prescription cancellation: prescriptionId={}", 
                event.getPrescriptionId());
        
        // Example: Cancel pharmacy orders
        // Example: Notify patient
        // Example: Update medical records
    }
}
