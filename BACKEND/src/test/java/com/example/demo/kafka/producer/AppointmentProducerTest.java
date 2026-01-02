package com.example.demo.kafka.producer;

import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.Message;

import com.example.demo.event.AppointmentEvent;

/**
 * Unit tests for AppointmentProducer
 */
@ExtendWith(MockitoExtension.class)
public class AppointmentProducerTest {

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    @InjectMocks
    private AppointmentProducer appointmentProducer;

    @Test
    public void testPublishAppointmentEvent_Success() {
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

        when(kafkaTemplate.send(any(Message.class))).thenReturn(null);

        // Act
        assertDoesNotThrow(() -> appointmentProducer.publishAppointmentEvent(event));

        // Assert
        verify(kafkaTemplate, times(1)).send(any(Message.class));
    }

    @Test
    public void testPublishAppointmentEvent_ThrowsException() {
        // Arrange
        AppointmentEvent event = AppointmentEvent.builder()
                .appointmentId(UUID.randomUUID().toString())
                .patientId("patient-123")
                .doctorId("doctor-456")
                .action("created")
                .build();

        when(kafkaTemplate.send(any(Message.class)))
                .thenThrow(new RuntimeException("Kafka error"));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> appointmentProducer.publishAppointmentEvent(event));
    }

    @Test
    public void testPublishAppointmentEvent_WithAllFields() {
        // Test publishing with all optional fields populated
        AppointmentEvent event = AppointmentEvent.builder()
                .appointmentId("apt-123")
                .patientId("pat-456")
                .doctorId("doc-789")
                .date(LocalDate.of(2025, 12, 25))
                .time("14:30")
                .reason("Annual checkup")
                .status("confirmed")
                .visitType("virtual")
                .action("updated")
                .build();

        when(kafkaTemplate.send(any(Message.class))).thenReturn(null);

        assertDoesNotThrow(() -> appointmentProducer.publishAppointmentEvent(event));
        verify(kafkaTemplate, times(1)).send(any(Message.class));
    }
}
