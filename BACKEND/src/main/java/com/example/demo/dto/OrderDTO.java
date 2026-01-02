package com.example.demo.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderDTO {
    private String id;
    private String userId;
    private Float total;
    private String status;
    private String shippingAddress;
    private List<OrderItemDTO> items;
    
    // Payment information
    private PaymentDTO payment;
    private String paymentStatus = "pending"; // pending, completed, failed
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

