package com.example.demo.controller;

import com.example.demo.dto.AppointmentDTO;
import com.example.demo.entity.Appointment;
import com.example.demo.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {
    private final AppointmentService appointmentService;

    @GetMapping
    public ResponseEntity<?> getAppointments() {
        try {
            String userId = getCurrentUserId();
            String userRole = getCurrentUserRole();
            
            List<Appointment> appointments = null;
            if ("patient".equals(userRole)) {
                appointments = appointmentService.getAppointmentsByPatient(userId);
            } else if ("doctor".equals(userRole)) {
                appointments = appointmentService.getAppointmentsByDoctor(userId);
            } else {
                appointments = appointmentService.getAllAppointments();
            }

            return new ResponseEntity<>(appointments.stream()
                    .map(this::convertToDTO).collect(Collectors.toList()), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/availability")
    public ResponseEntity<?> getAvailability(
            @RequestParam String doctorId,
            @RequestParam String date,
            @RequestParam(required = false) Integer bufferMinutes) {
        try {
            LocalDate appointmentDate = LocalDate.parse(date);
            Map<String, Object> availability = appointmentService.getAvailability(doctorId, appointmentDate, bufferMinutes);
            return new ResponseEntity<>(availability, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping
    public ResponseEntity<?> createAppointment(@RequestBody AppointmentDTO dto) {
        try {
            Appointment appointment = appointmentService.createAppointment(dto);
            return new ResponseEntity<>(convertToDTO(appointment), HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAppointment(@PathVariable String id) {
        try {
            Appointment appointment = appointmentService.getAppointmentById(id);
            return new ResponseEntity<>(convertToDTO(appointment), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAppointment(@PathVariable String id, @RequestBody AppointmentDTO dto) {
        try {
            Appointment appointment = appointmentService.updateAppointment(id, dto);
            return new ResponseEntity<>(convertToDTO(appointment), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAppointment(@PathVariable String id) {
        try {
            appointmentService.deleteAppointment(id);
            return new ResponseEntity<>(Map.of("message", "Appointment deleted successfully"), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.NOT_FOUND);
        }
    }

    protected String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (String) auth.getPrincipal();
    }

    protected String getCurrentUserRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (String) auth.getDetails();
    }

    private AppointmentDTO convertToDTO(Appointment apt) {
        AppointmentDTO dto = new AppointmentDTO();
        dto.setId(apt.getId());
        dto.setPatientId(apt.getPatientId());
        dto.setDoctorId(apt.getDoctorId());
        dto.setDate(apt.getDate());
        dto.setTime(apt.getTime());
        dto.setPatientName(apt.getPatient() != null ? apt.getPatient().getName() : "Unknown Patient");
        dto.setDoctorName(apt.getDoctor() != null ? apt.getDoctor().getName() : "Unknown Doctor");
        dto.setStatus(apt.getStatus());
        dto.setVisitType(apt.getVisitType());
        dto.setReason(apt.getReason());
        dto.setNotes(apt.getNotes());
        return dto;
    }
}
