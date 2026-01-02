package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    @Id
    private String id;

    @Column(nullable = false)
    private String userId;

    @ManyToOne
    @JoinColumn(name = "userId", insertable = false, updatable = false)
    private User user;

    @Column(nullable = false)
    private Float total;

    private String status = "pending"; // pending, processing, shipped, delivered

    @Column(nullable = false, columnDefinition = "TEXT")
    private String shippingAddress;

    @OneToMany(fetch = FetchType.EAGER)
    @JoinColumn(name = "orderId", insertable = false, updatable = false)
    private List<OrderItem> items;

    private String paymentStatus = "pending"; // pending, completed, failed

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(insertable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
