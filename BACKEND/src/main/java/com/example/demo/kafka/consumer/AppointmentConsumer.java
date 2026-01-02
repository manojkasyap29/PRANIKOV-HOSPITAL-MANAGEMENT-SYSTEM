package com.example.demo.kafka.consumer;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.example.demo.event.AppointmentEvent;
import com.example.demo.service.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class AppointmentConsumer {
    private final NotificationService notificationService;

    /**
     * Listen to appointment events from the appointments topic
     * Process appointment events and perform any downstream actions
     */
    @KafkaListener(
            topics = "${kafka.topic.appointment:appointments}",
            groupId = "appointment-consumer-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumeAppointmentEvent(AppointmentEvent event) {
        try {
            log.info("Received appointment event: appointmentId={}, action={}", 
                    event.getAppointmentId(), event.getAction());

            switch (event.getAction().toLowerCase()) {
                case "created":
                    handleAppointmentCreated(event);
                    break;
                case "updated":
                    handleAppointmentUpdated(event);
                    break;
                case "cancelled":
                    handleAppointmentCancelled(event);
                    break;
                case "accepted":
                    handleAppointmentAccepted(event);
                    break;
                case "rejected":
                    handleAppointmentRejected(event);
                    break;
                default:
                    log.warn("Unknown appointment action: {}", event.getAction());
            }

            log.info("Successfully processed appointment event: {}", event.getAppointmentId());
        } catch (Exception e) {
            log.error("Error processing appointment event: {}", event.getAppointmentId(), e);
            // Implement DLQ (Dead Letter Queue) handling here if needed
        }
    }

    private void handleAppointmentCreated(AppointmentEvent event) {
        log.info("Handling appointment creation: appointmentId={}, patientId={}, doctorId={}", 
                event.getAppointmentId(), event.getPatientId(), event.getDoctorId());
        
        // Example: Send notification to patient and doctor
        // Example: Update metrics/analytics
        // Example: Create calendar entries
    }

    private void handleAppointmentUpdated(AppointmentEvent event) {
        log.info("Handling appointment update: appointmentId={}, newStatus={}", 
                event.getAppointmentId(), event.getStatus());
        
        // Example: Update related records
        // Example: Send notification about the change
    }

    private void handleAppointmentCancelled(AppointmentEvent event) {
        log.info("Handling appointment cancellation: appointmentId={}", 
                event.getAppointmentId());
        
        // Example: Notify patient and doctor
        // Example: Free up doctor's time slot
        // Example: Process refunds if applicable
    }

    private void handleAppointmentAccepted(AppointmentEvent event) {
        log.info("🔵 HANDLING APPOINTMENT ACCEPTANCE - appointmentId={}, patientId={}, doctorId={}", 
                event.getAppointmentId(), event.getPatientId(), event.getDoctorId());
        
        try {
            String dateStr = event.getDate() != null ? event.getDate().toString() : "N/A";
            String timeStr = event.getTime() != null ? event.getTime() : "N/A";
            String doctorName = event.getDoctorName() != null ? event.getDoctorName() : "Your Doctor";
            
            log.info("  📅 Appointment details - date={}, time={}, doctor={}", 
                    dateStr, timeStr, doctorName);
            
            // DEADLOCK FIX: Fire and forget async notification - doesn't block Kafka listener thread
            // Notification service will run in separate thread pool with timeout protection
            log.info("  ⏳ Sending async SMS notification to patient...");
            notificationService.sendAppointmentAcceptanceNotification(
                    event.getPatientId(),
                    doctorName,
                    dateStr,
                    timeStr
            ).whenComplete((result, ex) -> {
                if (ex == null && result) {
                    log.info("  ✅ SMS NOTIFICATION SENT SUCCESSFULLY to patient: {}", event.getPatientId());
                } else if (ex != null) {
                    log.error("  ❌ SMS NOTIFICATION ERROR: {}", ex.getMessage(), ex);
                } else {
                    log.warn("  ⚠️ SMS NOTIFICATION FAILED for patient: {}", event.getPatientId());
                }
            });
            
            log.info("🟢 APPOINTMENT ACCEPTANCE HANDLING COMPLETED (notification queued asynchronously)");
        } catch (Exception e) {
            log.error("❌ ERROR in handleAppointmentAccepted: {}", e.getMessage(), e);
        }
    }

    private void handleAppointmentRejected(AppointmentEvent event) {
        log.info("Handling appointment rejection: appointmentId={}, patientId={}, doctorId={}", 
                event.getAppointmentId(), event.getPatientId(), event.getDoctorId());
        
        try {
            String doctorName = event.getDoctorName() != null ? event.getDoctorName() : "Doctor";
            String rejectionReason = event.getRejectionReason() != null ? event.getRejectionReason() : "";
            
            // DEADLOCK FIX: Fire and forget async notification - doesn't block Kafka listener thread
            log.info("Sending async rejection notification to patient {}", event.getPatientId());
            notificationService.sendAppointmentRejectionNotification(
                    event.getPatientId(),
                    doctorName,
                    rejectionReason
            ).whenComplete((result, ex) -> {
                if (ex == null && result) {
                    log.info("Rejection notification sent successfully to patient {}", event.getPatientId());
                } else if (ex != null) {
                    log.error("Rejection notification error for patient {}: {}", event.getPatientId(), ex.getMessage());
                } else {
                    log.warn("Rejection notification failed for patient {}", event.getPatientId());
                }
            });
        } catch (Exception e) {
            log.error("Error handling appointment rejection notification: {}", e.getMessage(), e);
        }
    }
}
