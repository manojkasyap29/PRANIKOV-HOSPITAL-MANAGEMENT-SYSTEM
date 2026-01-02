package com.example.demo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemDTO {
    private String id;
    private String orderId;
    private String productId;
    private String productName;
    private Integer quantity;
    private Float price;
}
