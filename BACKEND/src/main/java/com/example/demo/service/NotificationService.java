package com.example.demo.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    private final TwilioService twilioService;
    private final UserRepository userRepository;

    /**
     * Send appointment acceptance notification to patient via SMS
     * DEADLOCK FIX: Made @Async so it runs in separate thread pool and doesn't block Kafka listener
     */
    @Async("notificationExecutor")
    public CompletableFuture<Boolean> sendAppointmentAcceptanceNotification(String patientId, String doctorName, String appointmentDate, String appointmentTime) {
        log.info("🔵 SEND APPOINTMENT ACCEPTANCE NOTIFICATION - patientId={}, doctor={}", patientId, doctorName);
        
        try {
            log.info("  ⏳ Looking up patient in database...");
            Optional<User> patientOpt = userRepository.findById(patientId);
            if (patientOpt.isEmpty()) {
                log.warn("  ❌ Patient not found: {}", patientId);
                return CompletableFuture.completedFuture(false);
            }

            User patient = patientOpt.get();
            String patientPhone = patient.getPhone();
            log.info("  ✓ Patient found - name={}, phone={}", patient.getName(), patientPhone);

            if (patientPhone == null || patientPhone.isEmpty()) {
                log.warn("  ❌ Patient phone number not available: {}", patientId);
                return CompletableFuture.completedFuture(false);
            }

            // Format the message
            String message = String.format(
                    "Great news! Your appointment request has been accepted by Dr. %s on %s at %s. Please check your dashboard for more details. Reply STOP to unsubscribe.",
                    doctorName,
                    appointmentDate,
                    appointmentTime
            );
            
            log.info("  📱 Sending SMS via Twilio - phone={}", patientPhone);
            log.info("  📝 Message: {}", message);

            // Send SMS via Twilio (now with timeout protection)
            boolean sent = twilioService.sendSmsViaTwilio(patientPhone, message);
            if (sent) {
                log.info("  ✅ APPOINTMENT ACCEPTANCE SMS SENT SUCCESSFULLY to patient: {}", patientId);
            } else {
                log.error("  ❌ FAILED to send appointment acceptance SMS to patient: {}", patientId);
            }
            
            log.info("🟢 SEND APPOINTMENT ACCEPTANCE NOTIFICATION COMPLETED");
            return CompletableFuture.completedFuture(sent);
        } catch (Exception e) {
            log.error("❌ Error sending appointment acceptance notification to patient {}: {}", patientId, e.getMessage(), e);
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * Send appointment rejection notification to patient via SMS
     * DEADLOCK FIX: Made @Async so it runs in separate thread pool
     */
    @Async("notificationExecutor")
    public CompletableFuture<Boolean> sendAppointmentRejectionNotification(String patientId, String doctorName, String reason) {
        try {
            Optional<User> patientOpt = userRepository.findById(patientId);
            if (patientOpt.isEmpty()) {
                log.warn("Patient not found: {}", patientId);
                return CompletableFuture.completedFuture(false);
            }

            User patient = patientOpt.get();
            String patientPhone = patient.getPhone();

            if (patientPhone == null || patientPhone.isEmpty()) {
                log.warn("Patient phone number not available: {}", patientId);
                return CompletableFuture.completedFuture(false);
            }

            // Format the message
            String message = String.format(
                    "Your appointment request with Dr. %s has been declined. %s Please visit your dashboard to request another appointment. Reply STOP to unsubscribe.",
                    doctorName,
                    reason != null ? "Reason: " + reason + "." : ""
            );

            // Send SMS via Twilio
            boolean sent = twilioService.sendSmsViaTwilio(patientPhone, message);
            if (sent) {
                log.info("Appointment rejection notification sent to patient: {}", patientId);
            } else {
                log.error("Failed to send appointment rejection notification to patient: {}", patientId);
            }
            return CompletableFuture.completedFuture(sent);
        } catch (Exception e) {
            log.error("Error sending appointment rejection notification to patient {}: {}", patientId, e.getMessage(), e);
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * Send appointment status update notification to patient via SMS
     * DEADLOCK FIX: Made @Async so it runs in separate thread pool
     */
    @Async("notificationExecutor")
    public CompletableFuture<Boolean> sendAppointmentStatusNotification(String patientId, String status, String message) {
        try {
            Optional<User> patientOpt = userRepository.findById(patientId);
            if (patientOpt.isEmpty()) {
                log.warn("Patient not found: {}", patientId);
                return CompletableFuture.completedFuture(false);
            }

            User patient = patientOpt.get();
            String patientPhone = patient.getPhone();

            if (patientPhone == null || patientPhone.isEmpty()) {
                log.warn("Patient phone number not available: {}", patientId);
                return CompletableFuture.completedFuture(false);
            }

            // Send SMS via Twilio
            boolean sent = twilioService.sendSmsViaTwilio(patientPhone, message);
            if (sent) {
                log.info("Appointment status notification ({}) sent to patient: {}", status, patientId);
            } else {
                log.error("Failed to send appointment status notification to patient: {}", patientId);
            }
            return CompletableFuture.completedFuture(sent);
        } catch (Exception e) {
            log.error("Error sending appointment status notification to patient {}: {}", patientId, e.getMessage(), e);
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * Send direct SMS notification to a phone number (used for testing)
     * DEADLOCK FIX: Made @Async so it runs in separate thread pool
     */
    @Async("notificationExecutor")
    public CompletableFuture<Boolean> sendDirectSMS(String phoneNumber, String message) {
        try {
            if (phoneNumber == null || phoneNumber.isEmpty()) {
                log.warn("Phone number is null or empty");
                return CompletableFuture.completedFuture(false);
            }

            log.info("Sending direct SMS to: {}", phoneNumber);
            boolean sent = twilioService.sendSmsViaTwilio(phoneNumber, message);

            if (sent) {
                log.info("Direct SMS sent successfully to: {}", phoneNumber);
            } else {
                log.error("Failed to send direct SMS to: {}", phoneNumber);
            }

            return CompletableFuture.completedFuture(sent);
        } catch (Exception e) {
            log.error("Error sending direct SMS to {}: {}", phoneNumber, e.getMessage(), e);
            return CompletableFuture.failedFuture(e);
        }
    }

    @Async("notificationExecutor")
    public CompletableFuture<Boolean> sendOrderPlacedNotification(String patientId, String orderId, Double totalPrice) {
        try {
            Optional<User> patientOpt = userRepository.findById(patientId);
            if (patientOpt.isEmpty()) {
                log.warn("Patient not found: {}", patientId);
                return CompletableFuture.completedFuture(false);
            }

            User patient = patientOpt.get();
            String patientPhone = patient.getPhone();

            if (patientPhone == null || patientPhone.isEmpty()) {
                log.warn("Patient phone number not available: {}", patientId);
                return CompletableFuture.completedFuture(false);
            }

            String priceText = totalPrice != null ? String.format("%.2f", totalPrice) : "0.00";
            String message = String.format(
                    "Your order %s has been placed successfully. Total: ₹%s. We'll notify you when it ships. Reply STOP to unsubscribe.",
                    orderId,
                    priceText
            );

            boolean sent = twilioService.sendSmsViaTwilio(patientPhone, message);
            if (sent) {
                log.info("Order placed notification sent to patient: {}", patientId);
            } else {
                log.error("Failed to send order placed notification to patient: {}", patientId);
            }
            return CompletableFuture.completedFuture(sent);
        } catch (Exception e) {
            log.error("Error sending order placed notification to patient {}: {}", patientId, e.getMessage(), e);
            return CompletableFuture.failedFuture(e);
        }
    }

    @Async("notificationExecutor")
    public CompletableFuture<Boolean> sendOrderShippedNotification(String patientId, String orderId) {
        try {
            Optional<User> patientOpt = userRepository.findById(patientId);
            if (patientOpt.isEmpty()) {
                log.warn("Patient not found: {}", patientId);
                return CompletableFuture.completedFuture(false);
            }

            User patient = patientOpt.get();
            String patientPhone = patient.getPhone();

            if (patientPhone == null || patientPhone.isEmpty()) {
                log.warn("Patient phone number not available: {}", patientId);
                return CompletableFuture.completedFuture(false);
            }

            String message = String.format(
                    "Good news! Your order %s has shipped. Track delivery from your account. Reply STOP to unsubscribe.",
                    orderId
            );

            boolean sent = twilioService.sendSmsViaTwilio(patientPhone, message);
            if (sent) {
                log.info("Order shipped notification sent to patient: {}", patientId);
            } else {
                log.error("Failed to send order shipped notification to patient: {}", patientId);
            }
            return CompletableFuture.completedFuture(sent);
        } catch (Exception e) {
            log.error("Error sending order shipped notification to patient {}: {}", patientId, e.getMessage(), e);
            return CompletableFuture.failedFuture(e);
        }
    }

    @Async("notificationExecutor")
    public CompletableFuture<Boolean> sendOrderDeliveredNotification(String patientId, String orderId) {
        try {
            Optional<User> patientOpt = userRepository.findById(patientId);
            if (patientOpt.isEmpty()) {
                log.warn("Patient not found: {}", patientId);
                return CompletableFuture.completedFuture(false);
            }

            User patient = patientOpt.get();
            String patientPhone = patient.getPhone();

            if (patientPhone == null || patientPhone.isEmpty()) {
                log.warn("Patient phone number not available: {}", patientId);
                return CompletableFuture.completedFuture(false);
            }

            String message = String.format(
                    "Your order %s has been delivered. Thank you for shopping with us! Reply STOP to unsubscribe.",
                    orderId
            );

            boolean sent = twilioService.sendSmsViaTwilio(patientPhone, message);
            if (sent) {
                log.info("Order delivered notification sent to patient: {}", patientId);
            } else {
                log.error("Failed to send order delivered notification to patient: {}", patientId);
            }
            return CompletableFuture.completedFuture(sent);
        } catch (Exception e) {
            log.error("Error sending order delivered notification to patient {}: {}", patientId, e.getMessage(), e);
            return CompletableFuture.failedFuture(e);
        }
    }
}
