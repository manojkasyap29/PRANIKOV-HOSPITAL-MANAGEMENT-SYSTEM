package com.example.demo.kafka;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.annotation.DirtiesContext;

import com.example.demo.event.AppointmentEvent;
import com.example.demo.event.HealthRecordEvent;
import com.example.demo.event.OrderEvent;
import com.example.demo.event.PrescriptionEvent;
import com.example.demo.kafka.producer.AppointmentProducer;
import com.example.demo.kafka.producer.HealthRecordProducer;
import com.example.demo.kafka.producer.OrderProducer;
import com.example.demo.kafka.producer.PrescriptionProducer;

/**
 * Integration tests for Kafka producers and consumers
 * Uses embedded Kafka for testing without a real Kafka instance
 */
@SpringBootTest
@EmbeddedKafka(partitions = 1, brokerProperties = {
        "listeners=PLAINTEXT://localhost:9094",
        "port=9094"
})
@DirtiesContext
public class KafkaIntegrationTest {

    @Autowired
    private AppointmentProducer appointmentProducer;

    @Autowired
    private PrescriptionProducer prescriptionProducer;

    @Autowired
    private OrderProducer orderProducer;

    @Autowired
    private HealthRecordProducer healthRecordProducer;

    @Test
    public void testAppointmentEventPublishing() {
        // Arrange
        AppointmentEvent event = AppointmentEvent.builder()
                .appointmentId(UUID.randomUUID().toString())
                .patientId("patient-123")
                .doctorId("doctor-456")
                .date(LocalDate.now().plusDays(7))
                .time("10:30")
                .reason("Annual checkup")
                .status("scheduled")
                .visitType("in_person")
                .action("created")
                .build();

        // Act & Assert - Should not throw exception
        assertDoesNotThrow(() -> appointmentProducer.publishAppointmentEvent(event));
    }

    @Test
    public void testPrescriptionEventPublishing() {
        // Arrange
        PrescriptionEvent event = PrescriptionEvent.builder()
                .prescriptionId(UUID.randomUUID().toString())
                .patientId("patient-123")
                .doctorId("doctor-456")
                .medication("Aspirin")
                .dosage("500mg")
                .frequency("Twice daily")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(30))
                .status("active")
                .action("created")
                .build();

        // Act & Assert - Should not throw exception
        assertDoesNotThrow(() -> prescriptionProducer.publishPrescriptionEvent(event));
    }

    @Test
    public void testOrderEventPublishing() {
        // Arrange
        OrderEvent.OrderItemEvent item = OrderEvent.OrderItemEvent.builder()
                .productId("prod-123")
                .quantity(2)
                .price(25.99)
                .build();

        OrderEvent event = OrderEvent.builder()
                .orderId(UUID.randomUUID().toString())
                .patientId("patient-123")
                .pharmacyId("pharmacy-456")
                .totalPrice(51.98)
                .status("pending")
                .orderDate(LocalDateTime.now())
                .items(Arrays.asList(item))
                .action("created")
                .build();

        // Act & Assert - Should not throw exception
        assertDoesNotThrow(() -> orderProducer.publishOrderEvent(event));
    }

    @Test
    public void testHealthRecordEventPublishing() {
        // Arrange
        HealthRecordEvent event = HealthRecordEvent.builder()
                .recordId(UUID.randomUUID().toString())
                .patientId("patient-123")
                .doctorId("doctor-456")
                .recordType("lab_result")
                .description("Blood test results")
                .recordDate(LocalDate.now())
                .action("created")
                .build();

        // Act & Assert - Should not throw exception
        assertDoesNotThrow(() -> healthRecordProducer.publishHealthRecordEvent(event));
    }

    @Test
    public void testMultipleEventPublishing() {
        // Test that multiple events can be published in sequence
        for (int i = 0; i < 5; i++) {
            AppointmentEvent event = AppointmentEvent.builder()
                    .appointmentId(UUID.randomUUID().toString())
                    .patientId("patient-" + i)
                    .doctorId("doctor-" + i)
                    .date(LocalDate.now().plusDays(i))
                    .time("10:" + String.format("%02d", i * 10))
                    .reason("Checkup")
                    .status("scheduled")
                    .action("created")
                    .build();

            assertDoesNotThrow(() -> appointmentProducer.publishAppointmentEvent(event));
        }
    }

    @Test
    public void testEventFieldValidation() {
        // Test that events are created with all required fields
        AppointmentEvent event = AppointmentEvent.builder()
                .appointmentId("apt-123")
                .patientId("pat-456")
                .doctorId("doc-789")
                .date(LocalDate.now())
                .time("10:30")
                .action("created")
                .build();

        assertNotNull(event.getAppointmentId());
        assertNotNull(event.getPatientId());
        assertNotNull(event.getDoctorId());
        assertNotNull(event.getAction());
    }
}
