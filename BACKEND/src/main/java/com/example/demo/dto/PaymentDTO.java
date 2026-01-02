package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Payment information for orders
 * Includes multiple payment method options and QR codes
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDTO {
    private String orderId;
    private Double amount;
    private String currency = "INR";
    private String status = "pending"; // pending, completed, failed
    
    // UPI Payment (India)
    private String upiId;
    private String upiQRCode; // Base64 encoded QR code image
    
    // Card Payment
    private String stripePaymentLink;
    private String stripeQRCode;
    
    // Alternative Payment Methods
    private String paypalPaymentLink;
    private String paypalQRCode;
    
    // Razorpay (India)
    private String razorpayPaymentLink;
    private String razorpayQRCode;
    private String razorpayOrderId;
    private String razorpayKeyId;
    
    // Generic payment link
    private String paymentLink;
    private String paymentLinkQRCode;
    
    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private String paymentMethod; // upi, card, paypal, razorpay, etc.
    
    // Additional info
    private String description;
    private String notes;
}
