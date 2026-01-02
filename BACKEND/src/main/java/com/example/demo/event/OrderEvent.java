package com.example.demo.event;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Event published when an order is created or updated
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    @JsonProperty("order_id")
    private String orderId;

    @JsonProperty("patient_id")
    private String patientId;

    @JsonProperty("pharmacy_id")
    private String pharmacyId;

    @JsonProperty("total_price")
    private Double totalPrice;

    @JsonProperty("status")
    private String status;

    @JsonProperty("order_date")
    private LocalDateTime orderDate;

    @JsonProperty("delivery_date")
    private LocalDateTime deliveryDate;

    @JsonProperty("items")
    private List<OrderItemEvent> items;

    @JsonProperty("action")
    private String action; // "created", "updated", "shipped", "delivered"

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class OrderItemEvent {
        @JsonProperty("product_id")
        private String productId;

        @JsonProperty("quantity")
        private Integer quantity;

        @JsonProperty("price")
        private Double price;
    }
}
