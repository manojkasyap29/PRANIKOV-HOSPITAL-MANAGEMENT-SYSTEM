package com.example.demo.service;

import com.example.demo.dto.PaymentDTO;
import com.example.demo.entity.Order;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Payment Service
 * Handles payment processing and QR code generation for orders
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final QRCodeService qrCodeService;
    private final UserRepository userRepository;

    @Value("${app.payment.upi-id:}")
    private String upiId;

    @Value("${app.payment.upi-name:Pranikov Healthcare}")
    private String upiName;

    @Value("${app.payment.stripe-key:}")
    private String stripeKey;

    @Value("${app.payment.razorpay-key:}")
    private String razorpayKey;

    @Value("${app.payment.payment-gateway-url:}")
    private String paymentGatewayUrl;

    /**
     * Generate payment info for an order with QR codes
     * Supports multiple payment methods
     */
    public PaymentDTO generatePaymentInfo(Order order) {
        try {
            PaymentDTO payment = new PaymentDTO();
            payment.setOrderId(order.getId());
            payment.setAmount(order.getTotal().doubleValue());
            payment.setCreatedAt(LocalDateTime.now());
            payment.setExpiresAt(LocalDateTime.now().plusHours(24)); // 24-hour expiry
            payment.setDescription("Payment for Order #" + order.getId());

            // Generate UPI QR Code
            if (upiId != null && !upiId.isEmpty()) {
                try {
                    String upiQR = qrCodeService.generateUPIQRCode(
                            upiId,
                            upiName,
                            order.getTotal().doubleValue(),
                            order.getId()
                    );
                    payment.setUpiId(upiId);
                    payment.setUpiQRCode(upiQR);
                    log.info("✅ Generated UPI QR code for order: {}", order.getId());
                } catch (Exception e) {
                    log.error("❌ Failed to generate UPI QR: {}", e.getMessage());
                }
            }

            // Generate Stripe Payment Link
            if (stripeKey != null && !stripeKey.isEmpty()) {
                try {
                    String stripeUrl = generateStripePaymentLink(order);
                    String stripeQR = qrCodeService.generatePaymentLinkQRCode(stripeUrl);
                    payment.setStripePaymentLink(stripeUrl);
                    payment.setStripeQRCode(stripeQR);
                    log.info("✅ Generated Stripe QR code for order: {}", order.getId());
                } catch (Exception e) {
                    log.error("❌ Failed to generate Stripe QR: {}", e.getMessage());
                }
            }

            // Generate Razorpay Payment Link
            if (razorpayKey != null && !razorpayKey.isEmpty()) {
                try {
                    String razorpayUrl = generateRazorpayPaymentLink(order);
                    String razorpayQR = qrCodeService.generatePaymentLinkQRCode(razorpayUrl);
                    payment.setRazorpayPaymentLink(razorpayUrl);
                    payment.setRazorpayQRCode(razorpayQR);
                    log.info("✅ Generated Razorpay QR code for order: {}", order.getId());
                } catch (Exception e) {
                    log.error("❌ Failed to generate Razorpay QR: {}", e.getMessage());
                }
            }

            // Generate Generic Payment Link QR
            if (paymentGatewayUrl != null && !paymentGatewayUrl.isEmpty()) {
                try {
                    String genericPaymentUrl = String.format(
                            "%s?orderId=%s&amount=%.2f",
                            paymentGatewayUrl,
                            order.getId(),
                            order.getTotal()
                    );
                    String genericQR = qrCodeService.generatePaymentLinkQRCode(genericPaymentUrl);
                    payment.setPaymentLink(genericPaymentUrl);
                    payment.setPaymentLinkQRCode(genericQR);
                    log.info("✅ Generated generic payment QR code for order: {}", order.getId());
                } catch (Exception e) {
                    log.error("❌ Failed to generate generic payment QR: {}", e.getMessage());
                }
            }

            return payment;
        } catch (Exception e) {
            log.error("❌ Error generating payment info: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate payment information: " + e.getMessage());
        }
    }

    /**
     * Generate Stripe payment link
     */
    private String generateStripePaymentLink(Order order) {
        // In production, this would create an actual Stripe checkout session
        return String.format(
                "https://buy.stripe.com/test?amount=%.2f&orderId=%s",
                order.getTotal(),
                order.getId()
        );
    }

    /**
     * Generate Razorpay payment link
     */
    private String generateRazorpayPaymentLink(Order order) {
        // In production, this would create an actual Razorpay payment link
        return String.format(
                "https://razorpay.com/payment?orderId=%s&amount=%.2f",
                order.getId(),
                order.getTotal()
        );
    }

    /**
     * Get user details for payment
     */
    public String getUserName(String userId) {
        try {
            Optional<User> user = userRepository.findById(userId);
            return user.map(User::getName).orElse("Customer");
        } catch (Exception e) {
            return "Customer";
        }
    }
}
