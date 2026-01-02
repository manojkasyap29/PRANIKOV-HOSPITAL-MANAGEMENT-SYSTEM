package com.example.demo.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.example.demo.dto.AppointmentDTO;
import com.example.demo.entity.Appointment;
import com.example.demo.entity.User;
import com.example.demo.event.AppointmentEvent;
import com.example.demo.kafka.producer.AppointmentProducer;
import com.example.demo.repository.AppointmentRepository;
import com.example.demo.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final AppointmentProducer appointmentProducer;

    public Appointment createAppointment(AppointmentDTO dto) {
        Appointment appointment = new Appointment();
        appointment.setId(UUID.randomUUID().toString());
        appointment.setPatientId(dto.getPatientId());
        appointment.setDoctorId(dto.getDoctorId());
        appointment.setDate(dto.getDate());
        appointment.setTime(dto.getTime());
        appointment.setReason(dto.getReason());
        appointment.setStatus(dto.getStatus() != null ? dto.getStatus() : "scheduled");
        appointment.setVisitType(dto.getVisitType() != null ? dto.getVisitType() : "in_person");

        Appointment saved = appointmentRepository.save(appointment);

        // Publish appointment created event to Kafka
        AppointmentEvent event = AppointmentEvent.builder()
                .appointmentId(saved.getId())
                .patientId(saved.getPatientId())
                .doctorId(saved.getDoctorId())
                .date(saved.getDate())
                .time(saved.getTime())
                .reason(saved.getReason())
                .status(saved.getStatus())
                .visitType(saved.getVisitType())
                .action("created")
                .build();
        appointmentProducer.publishAppointmentEvent(event);

        return saved;
    }

    public Appointment getAppointmentById(String id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
    }

    public List<Appointment> getAppointmentsByPatient(String patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    public List<Appointment> getAppointmentsByDoctor(String doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public List<User> getPatientsByDoctor(String doctorId) {
        List<Appointment> appointments = appointmentRepository.findByDoctorId(doctorId);
        Set<String> patientIds = new HashSet<>();
        
        for (Appointment apt : appointments) {
            patientIds.add(apt.getPatientId());
        }
        
        List<User> patients = new ArrayList<>();
        for (String patientId : patientIds) {
            try {
                User patient = userRepository.findById(patientId).orElse(null);
                if (patient != null && "patient".equals(patient.getRole())) {
                    patients.add(patient);
                }
            } catch (Exception e) {
                // Skip if patient not found
            }
        }
        return patients;
    }

    public Appointment updateAppointment(String id, AppointmentDTO dto) {
        Appointment appointment = getAppointmentById(id);
        String oldStatus = appointment.getStatus();
        log.info("🔵 UPDATE APPOINTMENT - appointmentId={}, oldStatus={}, newStatus={}", 
                id, oldStatus, dto.getStatus());

        if (dto.getDate() != null) {
            appointment.setDate(dto.getDate());
        }
        if (dto.getTime() != null) {
            appointment.setTime(dto.getTime());
        }
        if (dto.getStatus() != null) {
            appointment.setStatus(dto.getStatus());
        }
        if (dto.getVisitType() != null) {
            appointment.setVisitType(dto.getVisitType());
        }
        if (dto.getReason() != null) {
            appointment.setReason(dto.getReason());
        }
        if (dto.getNotes() != null) {
            appointment.setNotes(dto.getNotes());
        }

        Appointment updated = appointmentRepository.save(appointment);
        log.info("  ✓ Appointment updated in database - newStatus={}", updated.getStatus());

        // Determine the action based on status change
        String action = "updated"; // default action
        if ("accepted".equals(updated.getStatus())) {
            action = "accepted";
            log.info("  ⏳ Status changed to ACCEPTED - will publish as 'accepted' event");
        } else if ("rejected".equals(updated.getStatus())) {
            action = "rejected";
            log.info("  ⏳ Status changed to REJECTED - will publish as 'rejected' event");
        } else if ("cancelled".equals(updated.getStatus())) {
            action = "cancelled";
            log.info("  ⏳ Status changed to CANCELLED - will publish as 'cancelled' event");
        }

        // Publish appointment event to Kafka with appropriate action
        AppointmentEvent event = AppointmentEvent.builder()
                .appointmentId(updated.getId())
                .patientId(updated.getPatientId())
                .doctorId(updated.getDoctorId())
                .date(updated.getDate())
                .time(updated.getTime())
                .reason(updated.getReason())
                .status(updated.getStatus())
                .visitType(updated.getVisitType())
                .action(action)
                .build();
        
        log.info("  ⏳ Publishing Kafka event - appointmentId={}, action={}", 
                event.getAppointmentId(), event.getAction());
        appointmentProducer.publishAppointmentEvent(event);
        log.info("  ✓ Kafka event published successfully");
        
        log.info("🟢 UPDATE APPOINTMENT COMPLETED");
        return updated;
    }

    public void deleteAppointment(String id) {
        Appointment appointment = getAppointmentById(id);
        appointmentRepository.deleteById(id);

        // Publish appointment cancelled event to Kafka
        AppointmentEvent event = AppointmentEvent.builder()
                .appointmentId(appointment.getId())
                .patientId(appointment.getPatientId())
                .doctorId(appointment.getDoctorId())
                .date(appointment.getDate())
                .time(appointment.getTime())
                .status("cancelled")
                .action("cancelled")
                .build();
        appointmentProducer.publishAppointmentEvent(event);
    }

    /**
     * Accept an appointment request (called by admin or doctor)
     */
    public Appointment acceptAppointment(String id, String doctorName) {
        log.info("🔵 APPOINTMENT ACCEPT STARTED - appointmentId={}, doctorName={}", id, doctorName);
        
        Appointment appointment = getAppointmentById(id);
        log.info("  ✓ Appointment found - patientId={}, current status={}", 
                appointment.getPatientId(), appointment.getStatus());
        
        appointment.setStatus("accepted");
        Appointment updated = appointmentRepository.save(appointment);
        log.info("  ✓ Status updated to ACCEPTED in database");

        // Publish appointment accepted event to Kafka
        AppointmentEvent event = AppointmentEvent.builder()
                .appointmentId(updated.getId())
                .patientId(updated.getPatientId())
                .doctorId(updated.getDoctorId())
                .doctorName(doctorName)
                .date(updated.getDate())
                .time(updated.getTime())
                .reason(updated.getReason())
                .status(updated.getStatus())
                .visitType(updated.getVisitType())
                .action("accepted")
                .build();
        
        log.info("  ⏳ Publishing Kafka event - appointmentId={}, action={}, patientId={}", 
                event.getAppointmentId(), event.getAction(), event.getPatientId());
        appointmentProducer.publishAppointmentEvent(event);
        log.info("  ✓ Kafka event published successfully");
        
        log.info("🟢 APPOINTMENT ACCEPT COMPLETED");
        return updated;
    }

    /**
     * Reject an appointment request (called by admin or doctor)
     */
    public Appointment rejectAppointment(String id, String doctorName, String rejectionReason) {
        Appointment appointment = getAppointmentById(id);
        appointment.setStatus("rejected");

        Appointment updated = appointmentRepository.save(appointment);

        // Publish appointment rejected event to Kafka
        AppointmentEvent event = AppointmentEvent.builder()
                .appointmentId(updated.getId())
                .patientId(updated.getPatientId())
                .doctorId(updated.getDoctorId())
                .doctorName(doctorName)
                .date(updated.getDate())
                .time(updated.getTime())
                .reason(updated.getReason())
                .status(updated.getStatus())
                .visitType(updated.getVisitType())
                .action("rejected")
                .rejectionReason(rejectionReason)
                .build();
        appointmentProducer.publishAppointmentEvent(event);

        return updated;
    }

    public Map<String, Object> getAvailability(String doctorId, LocalDate date, Integer bufferMinutes) {
        // Make buffer effectively final to use in lambda
        final int buffer = (bufferMinutes != null) ? bufferMinutes : 10;

        List<Appointment> appointments = appointmentRepository.findByDoctorIdAndDate(doctorId, date);
        Set<String> occupied = new HashSet<>();

        for (Appointment apt : appointments) {
            if (apt.getStatus() != null && !apt.getStatus().equals("cancelled")) {
                occupied.add(apt.getTime());
            }
        }

        List<Map<String, Object>> slots = new ArrayList<>();
        int startHour = 9;
        int endHour = 17;
        int stepMinutes = 30;

        Set<Integer> occupiedMinutes = new HashSet<>();
        for (String time : occupied) {
            try {
                String[] parts = time.split(":");
                int h = Integer.parseInt(parts[0]);
                int m = Integer.parseInt(parts[1]);
                occupiedMinutes.add(h * 60 + m);
            } catch (Exception e) {
                // Skip malformed times
            }
        }

        LocalDateTime start = LocalDateTime.of(date, LocalTime.of(startHour, 0));
        LocalDateTime end = LocalDateTime.of(date, LocalTime.of(endHour, 0));

        while (start.isBefore(end)) {
            String timeStr = String.format("%02d:%02d", start.getHour(), start.getMinute());
            final int timeMinutes = start.getHour() * 60 + start.getMinute();

            boolean available = !occupied.contains(timeStr);
            boolean blocked = occupiedMinutes.stream()
                    .anyMatch(om -> Math.abs(timeMinutes - om) <= buffer);

            Map<String, Object> slot = new HashMap<>();
            slot.put("time", timeStr);
            slot.put("available", available && !blocked);
            slots.add(slot);

            start = start.plusMinutes(stepMinutes);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("doctorId", doctorId);
        result.put("date", date.toString());
        result.put("type", "in_person");
        result.put("slots", slots);

        return result;
    }
}