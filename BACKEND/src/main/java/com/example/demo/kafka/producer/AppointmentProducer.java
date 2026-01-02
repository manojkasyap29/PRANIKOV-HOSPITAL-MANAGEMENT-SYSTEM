package com.example.demo.kafka.producer;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;

import com.example.demo.event.AppointmentEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topic.appointment:appointments}")
    private String appointmentTopic;

    /**
     * Publish an appointment event to the Kafka topic
     * @param event the appointment event to publish
     */
    public void publishAppointmentEvent(AppointmentEvent event) {
        try {
            log.info("Publishing appointment event: {}", event.getAppointmentId());
            
            Message<AppointmentEvent> message = MessageBuilder
                    .withPayload(event)
                    .setHeader(KafkaHeaders.TOPIC, appointmentTopic)
                    .build();

            kafkaTemplate.send(message);
            log.info("Successfully published appointment event: {}", event.getAppointmentId());
        } catch (Exception e) {
            log.error("Error publishing appointment event: {}", event.getAppointmentId(), e);
            throw new RuntimeException("Failed to publish appointment event", e);
        }
    }
}
