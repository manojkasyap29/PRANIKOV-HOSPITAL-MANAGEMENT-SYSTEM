package com.example.demo.controller;

import com.example.demo.service.UserService;
import com.example.demo.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.example.demo.entity.User;
import com.example.demo.entity.Appointment;
import com.example.demo.dto.UserDTO;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {
    private final UserService userService;
    private final AppointmentService appointmentService;

    @GetMapping
    public ResponseEntity<?> getAllDoctors() {
        try {
            List<User> doctors = userService.getUsersByRole("doctor");
            return new ResponseEntity<>(doctors.stream()
                    .map(this::convertToDTO).collect(Collectors.toList()), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDoctor(@PathVariable String id) {
        try {
            User doctor = userService.getUserById(id);
            if (!"doctor".equals(doctor.getRole())) {
                return new ResponseEntity<>(Map.of("message", "Doctor not found"), HttpStatus.NOT_FOUND);
            }
            return new ResponseEntity<>(convertToDTO(doctor), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{doctorId}/appointments/{appointmentId}/accept")
    public ResponseEntity<?> acceptAppointment(@PathVariable String doctorId, @PathVariable String appointmentId, 
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String currentDoctorId = getCurrentUserId();
            if (!currentDoctorId.equals(doctorId)) {
                return new ResponseEntity<>(Map.of("message", "Unauthorized"), HttpStatus.FORBIDDEN);
            }
            
            Appointment appointment = appointmentService.getAppointmentById(appointmentId);
            if (!appointment.getDoctorId().equals(doctorId)) {
                return new ResponseEntity<>(Map.of("message", "This appointment is not assigned to you"), HttpStatus.FORBIDDEN);
            }
            
            User doctor = userService.getUserById(doctorId);
            Appointment updated = appointmentService.acceptAppointment(appointmentId, doctor.getName());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Appointment accepted successfully");
            response.put("appointment", updated);
            response.put("notification", "Patient will be notified via SMS");
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/{doctorId}/appointments/{appointmentId}/reject")
    public ResponseEntity<?> rejectAppointment(@PathVariable String doctorId, @PathVariable String appointmentId,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String currentDoctorId = getCurrentUserId();
            if (!currentDoctorId.equals(doctorId)) {
                return new ResponseEntity<>(Map.of("message", "Unauthorized"), HttpStatus.FORBIDDEN);
            }
            
            Appointment appointment = appointmentService.getAppointmentById(appointmentId);
            if (!appointment.getDoctorId().equals(doctorId)) {
                return new ResponseEntity<>(Map.of("message", "This appointment is not assigned to you"), HttpStatus.FORBIDDEN);
            }
            
            String rejectionReason = (body != null && body.containsKey("reason")) ? body.get("reason") : "Request declined";
            User doctor = userService.getUserById(doctorId);
            Appointment updated = appointmentService.rejectAppointment(appointmentId, doctor.getName(), rejectionReason);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Appointment rejected successfully");
            response.put("appointment", updated);
            response.put("notification", "Patient will be notified via SMS");
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    protected String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (String) auth.getPrincipal();
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setName(user.getName());
        dto.setRole(user.getRole());
        dto.setPhone(user.getPhone());
        dto.setSpecialization(user.getSpecialization());
        dto.setLicense(user.getLicense());
        dto.setImageUrl(user.getImageUrl());
        return dto;
    }
}
