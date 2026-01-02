package com.example.demo.kafka.producer;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;

import com.example.demo.event.OrderEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topic.order:orders}")
    private String orderTopic;

    /**
     * Publish an order event to the Kafka topic
     * @param event the order event to publish
     */
    public void publishOrderEvent(OrderEvent event) {
        try {
            log.info("Publishing order event: {}", event.getOrderId());
            
            Message<OrderEvent> message = MessageBuilder
                    .withPayload(event)
                    .setHeader(KafkaHeaders.TOPIC, orderTopic)
                    .build();

            kafkaTemplate.send(message);
            log.info("Successfully published order event: {}", event.getOrderId());
        } catch (Exception e) {
            log.error("Error publishing order event: {}", event.getOrderId(), e);
            throw new RuntimeException("Failed to publish order event", e);
        }
    }
}
