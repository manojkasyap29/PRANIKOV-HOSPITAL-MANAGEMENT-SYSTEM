package com.example.demo.kafka.consumer;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.example.demo.event.OrderEvent;
import com.example.demo.service.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderConsumer {
    private final NotificationService notificationService;

    /**
     * Listen to order events from the orders topic
     * Process order events and perform any downstream actions
     */
    @KafkaListener(
            topics = "${kafka.topic.order:orders}",
            groupId = "order-consumer-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumeOrderEvent(OrderEvent event) {
        try {
            log.info("Received order event: orderId={}, action={}", 
                    event.getOrderId(), event.getAction());

            switch (event.getAction().toLowerCase()) {
                case "created":
                    handleOrderCreated(event);
                    break;
                case "updated":
                    handleOrderUpdated(event);
                    break;
                case "shipped":
                    handleOrderShipped(event);
                    break;
                case "delivered":
                    handleOrderDelivered(event);
                    break;
                default:
                    log.warn("Unknown order action: {}", event.getAction());
            }

            log.info("Successfully processed order event: {}", event.getOrderId());
        } catch (Exception e) {
            log.error("Error processing order event: {}", event.getOrderId(), e);
            // Implement DLQ (Dead Letter Queue) handling here if needed
        }
    }

    private void handleOrderCreated(OrderEvent event) {
        log.info("Handling order creation: orderId={}, patientId={}, totalPrice={}", 
                event.getOrderId(), event.getPatientId(), event.getTotalPrice());
        
        try {
            // DEADLOCK FIX: Fire and forget async notification - doesn't block Kafka listener thread
            notificationService.sendOrderPlacedNotification(
                    event.getPatientId(),
                    event.getOrderId(),
                    event.getTotalPrice()
            ).whenComplete((result, ex) -> {
                if (ex == null && result) {
                    log.info("Order placed notification sent successfully to patient {}", event.getPatientId());
                } else if (ex != null) {
                    log.error("Order placed notification error: {}", ex.getMessage());
                } else {
                    log.warn("Order placed notification failed for patient {}", event.getPatientId());
                }
            });
        } catch (Exception e) {
            log.error("Error sending order creation notification: {}", e.getMessage(), e);
        }
        
        // Example: Initiate payment processing
        // Example: Create inventory reservations
        // Example: Notify pharmacy/supplier
    }

    private void handleOrderUpdated(OrderEvent event) {
        log.info("Handling order update: orderId={}, newStatus={}", 
                event.getOrderId(), event.getStatus());
        
        try {
            String status = event.getStatus() != null ? event.getStatus().toLowerCase() : "";
            if ("shipped".equals(status)) {
                // DEADLOCK FIX: Fire and forget async notification
                notificationService.sendOrderShippedNotification(event.getPatientId(), event.getOrderId())
                    .whenComplete((result, ex) -> {
                        if (ex != null) log.error("Shipped notification error: {}", ex.getMessage());
                    });
            } else if ("delivered".equals(status)) {
                // DEADLOCK FIX: Fire and forget async notification
                notificationService.sendOrderDeliveredNotification(event.getPatientId(), event.getOrderId())
                    .whenComplete((result, ex) -> {
                        if (ex != null) log.error("Delivered notification error: {}", ex.getMessage());
                    });
            }
        } catch (Exception e) {
            log.error("Error sending order update notification: {}", e.getMessage(), e);
        }
        
        // Example: Update patient about changes
        // Example: Adjust inventory if items changed
    }

    private void handleOrderShipped(OrderEvent event) {
        log.info("Handling order shipment: orderId={}, deliveryDate={}", 
                event.getOrderId(), event.getDeliveryDate());
        
        try {
            // DEADLOCK FIX: Fire and forget async notification - doesn't block Kafka listener thread
            notificationService.sendOrderShippedNotification(event.getPatientId(), event.getOrderId())
                .whenComplete((result, ex) -> {
                    if (ex == null && result) {
                        log.info("Order shipped notification sent successfully");
                    } else if (ex != null) {
                        log.error("Order shipped notification error: {}", ex.getMessage());
                    }
                });
        } catch (Exception e) {
            log.error("Error sending order shipment notification: {}", e.getMessage(), e);
        }
        
        // Example: Generate tracking number
        // Example: Update logistics system
    }

    private void handleOrderDelivered(OrderEvent event) {
        log.info("Handling order delivery: orderId={}", event.getOrderId());
        
        try {
            // DEADLOCK FIX: Fire and forget async notification - doesn't block Kafka listener thread
            notificationService.sendOrderDeliveredNotification(event.getPatientId(), event.getOrderId())
                .whenComplete((result, ex) -> {
                    if (ex == null && result) {
                        log.info("Order delivered notification sent successfully");
                    } else if (ex != null) {
                        log.error("Order delivered notification error: {}", ex.getMessage());
                    }
                });
        } catch (Exception e) {
            log.error("Error sending order delivery notification: {}", e.getMessage(), e);
        }
        
        // Example: Complete order fulfillment
        // Example: Trigger customer feedback request
        // Example: Update analytics
    }
}
