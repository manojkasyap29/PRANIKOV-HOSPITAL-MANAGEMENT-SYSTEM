package com.example.demo.kafka.consumer;

import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.demo.event.AppointmentEvent;

/**
 * Unit tests for AppointmentConsumer
 */
@ExtendWith(MockitoExtension.class)
public class AppointmentConsumerTest {

    @InjectMocks
    private AppointmentConsumer appointmentConsumer;

    @Test
    public void testConsumeAppointmentEvent_Created() {
        // Arrange
        AppointmentEvent event = AppointmentEvent.builder()
                .appointmentId(UUID.randomUUID().toString())
                .patientId("patient-123")
                .doctorId("doctor-456")
                .date(LocalDate.now().plusDays(7))
                .time("10:30")
                .reason("Checkup")
                .status("scheduled")
                .action("created")
                .build();

        // Act & Assert
        assertDoesNotThrow(() -> appointmentConsumer.consumeAppointmentEvent(event));
    }

    @Test
    public void testConsumeAppointmentEvent_Updated() {
        // Arrange
        AppointmentEvent event = AppointmentEvent.builder()
                .appointmentId(UUID.randomUUID().toString())
                .patientId("patient-123")
                .doctorId("doctor-456")
                .status("rescheduled")
                .action("updated")
                .build();

        // Act & Assert
        assertDoesNotThrow(() -> appointmentConsumer.consumeAppointmentEvent(event));
    }

    @Test
    public void testConsumeAppointmentEvent_Cancelled() {
        // Arrange
        AppointmentEvent event = AppointmentEvent.builder()
                .appointmentId(UUID.randomUUID().toString())
                .patientId("patient-123")
                .doctorId("doctor-456")
                .status("cancelled")
                .action("cancelled")
                .build();

        // Act & Assert
        assertDoesNotThrow(() -> appointmentConsumer.consumeAppointmentEvent(event));
    }

    @Test
    public void testConsumeAppointmentEvent_UnknownAction() {
        // Arrange
        AppointmentEvent event = AppointmentEvent.builder()
                .appointmentId(UUID.randomUUID().toString())
                .patientId("patient-123")
                .doctorId("doctor-456")
                .action("unknown_action")
                .build();

        // Act & Assert - Should handle gracefully
        assertDoesNotThrow(() -> appointmentConsumer.consumeAppointmentEvent(event));
    }
}
