package com.example.demo.controller;

import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.example.demo.entity.User;
import com.example.demo.dto.UserDTO;
import com.example.demo.service.AppointmentService;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {
    private final UserService userService;
    private final AppointmentService appointmentService;

    @GetMapping
    public ResponseEntity<?> getAllPatients() {
        try {
            List<User> patients = userService.getUsersByRole("patient");
            return new ResponseEntity<>(patients.stream()
                    .map(this::convertToDTO).collect(Collectors.toList()), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPatient(@PathVariable String id) {
        try {
            User patient = userService.getUserById(id);
            if (!"patient".equals(patient.getRole())) {
                return new ResponseEntity<>(Map.of("message", "Patient not found"), HttpStatus.NOT_FOUND);
            }
            return new ResponseEntity<>(convertToDTO(patient), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<?> getPatientsByDoctor(@PathVariable String doctorId) {
        try {
            String currentUserId = getCurrentUserId();
            
            // Get current user to check role
            User currentUser = userService.getUserById(currentUserId);
            String currentUserRole = currentUser.getRole();
            
            // Only doctors can see their patients, or admins can see all
            if (!("doctor".equals(currentUserRole) && currentUserId.equals(doctorId)) && 
                !"admin".equals(currentUserRole)) {
                return new ResponseEntity<>(Map.of("message", "Unauthorized"), HttpStatus.FORBIDDEN);
            }

            // Get all appointments for the doctor and extract unique patients
            List<User> patients = appointmentService.getPatientsByDoctor(doctorId);
            return new ResponseEntity<>(patients.stream()
                    .map(this::convertToDTO).collect(Collectors.toList()), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
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
        dto.setDateOfBirth(user.getDateOfBirth());
        dto.setAddress(user.getAddress());
        dto.setImageUrl(user.getImageUrl());
        return dto;
    }
}
