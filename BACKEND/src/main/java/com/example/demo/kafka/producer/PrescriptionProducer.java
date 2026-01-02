package com.example.demo.kafka.producer;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;

import com.example.demo.event.PrescriptionEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PrescriptionProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topic.prescription:prescriptions}")
    private String prescriptionTopic;

    /**
     * Publish a prescription event to the Kafka topic
     * @param event the prescription event to publish
     */
    public void publishPrescriptionEvent(PrescriptionEvent event) {
        try {
            log.info("Publishing prescription event: {}", event.getPrescriptionId());
            
            Message<PrescriptionEvent> message = MessageBuilder
                    .withPayload(event)
                    .setHeader(KafkaHeaders.TOPIC, prescriptionTopic)
                    .build();

            kafkaTemplate.send(message);
            log.info("Successfully published prescription event: {}", event.getPrescriptionId());
        } catch (Exception e) {
            log.error("Error publishing prescription event: {}", event.getPrescriptionId(), e);
            throw new RuntimeException("Failed to publish prescription event", e);
        }
    }
}
