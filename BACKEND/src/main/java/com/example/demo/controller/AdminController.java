package com.example.demo.controller;

import com.example.demo.service.UserService;
import com.example.demo.service.AppointmentService;
import com.example.demo.service.NotificationService;
import com.example.demo.dto.UserDTO;
import com.example.demo.entity.User;
import com.example.demo.entity.Appointment;
import com.example.demo.repository.AppointmentRepository;
import com.example.demo.repository.OrderRepository;
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
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final UserService userService;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentService appointmentService;
    private final NotificationService notificationService;
    private final OrderRepository orderRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        try {
            if (!isAdmin()) {
                return new ResponseEntity<>(Map.of("message", "Unauthorized"), HttpStatus.FORBIDDEN);
            }
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalUsers", userService.getAllUsers().size());
            stats.put("totalPatients", userService.getUsersByRole("patient").size());
            stats.put("totalDoctors", userService.getUsersByRole("doctor").size());
            stats.put("totalAppointments", appointmentRepository.findAll().size());
            stats.put("todayAppointments", appointmentRepository.findByDate(LocalDate.now()).size());
            stats.put("totalOrders", orderRepository.findAll().size());
            
            return new ResponseEntity<>(stats, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            if (!isAdmin()) {
                return new ResponseEntity<>(Map.of("message", "Unauthorized"), HttpStatus.FORBIDDEN);
            }
            
            List<User> users = userService.getAllUsers();
            return new ResponseEntity<>(users.stream()
                    .map(this::convertToDTO).collect(Collectors.toList()), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody UserDTO dto) {
        try {
            if (!isAdmin()) {
                return new ResponseEntity<>(Map.of("message", "Unauthorized"), HttpStatus.FORBIDDEN);
            }
            
            User user = userService.updateUser(id, dto);
            return new ResponseEntity<>(convertToDTO(user), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        try {
            if (!isAdmin()) {
                return new ResponseEntity<>(Map.of("message", "Unauthorized"), HttpStatus.FORBIDDEN);
            }
            
            userService.deleteUser(id);
            return new ResponseEntity<>(Map.of("message", "User deleted successfully"), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/appointments/{appointmentId}/accept")
    public ResponseEntity<?> acceptAppointment(@PathVariable String appointmentId, @RequestBody(required = false) Map<String, String> body) {
        try {
            if (!isAdmin()) {
                return new ResponseEntity<>(Map.of("message", "Unauthorized"), HttpStatus.FORBIDDEN);
            }
            
            Appointment appointment = appointmentService.getAppointmentById(appointmentId);
            User doctor = appointment.getDoctor();
            if (doctor == null) {
                doctor = new User();
                doctor.setName("Doctor");
            }
            
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

    @PostMapping("/appointments/{appointmentId}/reject")
    public ResponseEntity<?> rejectAppointment(@PathVariable String appointmentId, @RequestBody(required = false) Map<String, String> body) {
        try {
            if (!isAdmin()) {
                return new ResponseEntity<>(Map.of("message", "Unauthorized"), HttpStatus.FORBIDDEN);
            }
            
            String rejectionReason = (body != null && body.containsKey("reason")) ? body.get("reason") : "Request declined";
            Appointment appointment = appointmentService.getAppointmentById(appointmentId);
            User doctor = appointment.getDoctor();
            if (doctor == null) {
                doctor = new User();
                doctor.setName("Doctor");
            }
            
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

    @PostMapping("/test-notification")
    public ResponseEntity<?> testNotification(@RequestBody(required = false) Map<String, String> body) {
        try {
            // Allow testing without authentication for demo purposes
            // if (!isAdmin()) {
            //     return new ResponseEntity<>(Map.of("message", "Unauthorized"), HttpStatus.FORBIDDEN);
            // }
            
            // Extract parameters from request body
            String patientId = (body != null && body.containsKey("patientId")) ? body.get("patientId") : null;
            String doctorName = (body != null && body.containsKey("doctorName")) ? body.get("doctorName") : "Dr. Smith";
            String appointmentDate = (body != null && body.containsKey("date")) ? body.get("date") : "2025-12-30";
            String appointmentTime = (body != null && body.containsKey("time")) ? body.get("time") : "14:30";
            String reason = (body != null && body.containsKey("reason")) ? body.get("reason") : null;
            
            if (patientId == null) {
                return new ResponseEntity<>(Map.of("message", "patientId is required in request body"), HttpStatus.BAD_REQUEST);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("test", "Sending notification");
            response.put("patientId", patientId);
            response.put("doctorName", doctorName);
            response.put("date", appointmentDate);
            response.put("time", appointmentTime);
            
            // Send acceptance notification (DEADLOCK FIX: async call, don't block on result)
            if (reason == null) {
                notificationService.sendAppointmentAcceptanceNotification(
                        patientId,
                        doctorName,
                        appointmentDate,
                        appointmentTime
                ).whenComplete((result, ex) -> {
                    if (ex != null) {
                        System.err.println("Notification error: " + ex.getMessage());
                    }
                });
                response.put("type", "acceptance");
                response.put("notificationSent", true);
                response.put("message", "Acceptance notification queued (async)");
            } else {
                // Send rejection notification (DEADLOCK FIX: async call, don't block on result)
                notificationService.sendAppointmentRejectionNotification(
                        patientId,
                        doctorName,
                        reason
                ).whenComplete((result, ex) -> {
                    if (ex != null) {
                        System.err.println("Notification error: " + ex.getMessage());
                    }
                });
                response.put("type", "rejection");
                response.put("reason", reason);
                response.put("notificationSent", true);
                response.put("message", "Rejection notification queued (async)");
            }
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage(), "error", e.getClass().getName()), HttpStatus.INTERNAL_SERVER_ERROR);
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

    @PostMapping("/send-notification-direct")
    public ResponseEntity<?> sendNotificationDirect(@RequestBody Map<String, String> body) {
        try {
            String patientId = body.get("patientId");
            String message = body.get("message");
            
            if (patientId == null || message == null) {
                return new ResponseEntity<>(Map.of("error", "patientId and message are required"), HttpStatus.BAD_REQUEST);
            }
            
            // Get patient
            User patient = userService.getUserById(patientId);
            if (patient == null) {
                return new ResponseEntity<>(Map.of("error", "Patient not found: " + patientId), HttpStatus.NOT_FOUND);
            }
            
            String phone = patient.getPhone();
            if (phone == null || phone.isEmpty()) {
                return new ResponseEntity<>(Map.of("error", "Patient phone number not found"), HttpStatus.BAD_REQUEST);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("patientId", patientId);
            response.put("patientName", patient.getName());
            response.put("patientPhone", phone);
            response.put("message", message);
            
            // Send directly via Twilio (DEADLOCK FIX: async call, don't block on result)
            notificationService.sendDirectSMS(phone, message)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        System.err.println("SMS send error: " + ex.getMessage());
                    }
                });
            
            response.put("sent", true);
            response.put("status", "SMS queued for sending (async)");
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("error", e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/debug/patient/{patientId}")
    public ResponseEntity<?> debugPatientInfo(@PathVariable String patientId) {
        try {
            Map<String, Object> debug = new HashMap<>();
            
            // Check if patient exists
            User patient = userService.getUserById(patientId);
            if (patient == null) {
                debug.put("error", "Patient not found");
                debug.put("patientId", patientId);
                return new ResponseEntity<>(debug, HttpStatus.NOT_FOUND);
            }
            
            debug.put("patientId", patient.getId());
            debug.put("patientName", patient.getName());
            debug.put("patientEmail", patient.getEmail());
            debug.put("patientPhone", patient.getPhone());
            debug.put("phoneIsNull", patient.getPhone() == null);
            debug.put("phoneIsEmpty", patient.getPhone() != null && patient.getPhone().isEmpty());
            debug.put("status", "Patient found");
            
            return new ResponseEntity<>(debug, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("error", e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    protected boolean isAdmin() {
        return "admin".equals(getCurrentUserRole());
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setName(user.getName());
        dto.setRole(user.getRole());
        dto.setPhone(user.getPhone());
        dto.setPhoneVerified(user.getPhoneVerified());
        dto.setAddress(user.getAddress());
        dto.setSpecialization(user.getSpecialization());
        dto.setLicense(user.getLicense());
        dto.setImageUrl(user.getImageUrl());
        return dto;
    }
}
