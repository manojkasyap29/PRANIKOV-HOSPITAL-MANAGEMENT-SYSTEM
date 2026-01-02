package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.example.demo.dto.OrderDTO;
import com.example.demo.dto.OrderItemDTO;
import com.example.demo.entity.Order;
import com.example.demo.entity.OrderItem;
import com.example.demo.event.OrderEvent;
import com.example.demo.kafka.producer.OrderProducer;
import com.example.demo.repository.OrderItemRepository;
import com.example.demo.repository.OrderRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderProducer orderProducer;

    public Order createOrder(OrderDTO dto) {
        Order order = new Order();
        order.setId(UUID.randomUUID().toString());
        order.setUserId(dto.getUserId());
        order.setTotal(dto.getTotal());
        order.setShippingAddress(dto.getShippingAddress());
        order.setStatus("pending");

        Order savedOrder = orderRepository.save(order);

        // Create order items
        List<OrderEvent.OrderItemEvent> itemEvents = new java.util.ArrayList<>();
        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            for (OrderItemDTO itemDto : dto.getItems()) {
                OrderItem item = new OrderItem();
                item.setId(UUID.randomUUID().toString());
                item.setOrderId(savedOrder.getId());
                item.setProductId(itemDto.getProductId());
                item.setQuantity(itemDto.getQuantity());
                item.setPrice(itemDto.getPrice());
                orderItemRepository.save(item);

                itemEvents.add(OrderEvent.OrderItemEvent.builder()
                        .productId(itemDto.getProductId())
                        .quantity(itemDto.getQuantity())
                        .price(itemDto.getPrice() != null ? itemDto.getPrice().doubleValue() : 0.0)
                        .build());
            }
        }

        // Publish order created event to Kafka
        OrderEvent event = OrderEvent.builder()
                .orderId(savedOrder.getId())
                .patientId(savedOrder.getUserId())
                .totalPrice(savedOrder.getTotal() != null ? savedOrder.getTotal().doubleValue() : 0.0)
                .status(savedOrder.getStatus())
                .orderDate(LocalDateTime.now())
                .items(itemEvents)
                .action("created")
                .build();
        orderProducer.publishOrderEvent(event);

        return savedOrder;
    }

    public Order getOrderById(String id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    public List<Order> getOrdersByUser(String userId) {
        return orderRepository.findByUserId(userId);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Order updateOrderStatus(String id, String status) {
        Order order = getOrderById(id);
        order.setStatus(status);
        Order updated = orderRepository.save(order);

        // Publish order status update event to Kafka
        OrderEvent event = OrderEvent.builder()
                .orderId(updated.getId())
                .patientId(updated.getUserId())
                .totalPrice(updated.getTotal() != null ? updated.getTotal().doubleValue() : 0.0)
                .status(updated.getStatus())
                .orderDate(updated.getCreatedAt() != null ? updated.getCreatedAt() : LocalDateTime.now())
                .action("updated")
                .build();
        orderProducer.publishOrderEvent(event);

        return updated;
    }

    public void deleteOrder(String id) {
        // Delete order items first
        List<OrderItem> items = orderItemRepository.findByOrderId(id);
        orderItemRepository.deleteAll(items);
        // Delete order
        orderRepository.deleteById(id);
    }

    public List<OrderItem> getOrderItems(String orderId) {
        return orderItemRepository.findByOrderId(orderId);
    }
}
