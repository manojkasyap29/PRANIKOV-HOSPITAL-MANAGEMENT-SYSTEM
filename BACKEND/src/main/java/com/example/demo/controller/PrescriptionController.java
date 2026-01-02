package com.example.demo.controller;

import com.example.demo.dto.PrescriptionDTO;
import com.example.demo.entity.Prescription;
import com.example.demo.service.PrescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {
    private final PrescriptionService prescriptionService;

    @GetMapping
    public ResponseEntity<?> getPrescriptions() {
        try {
            String userId = getCurrentUserId();
            String userRole = getCurrentUserRole();

            List<Prescription> prescriptions = null;
            if ("patient".equals(userRole)) {
                prescriptions = prescriptionService.getPrescriptionsByPatient(userId);
            } else if ("doctor".equals(userRole)) {
                prescriptions = prescriptionService.getPrescriptionsByDoctor(userId);
            } else {
                prescriptions = prescriptionService.getAllPrescriptions();
            }

            return new ResponseEntity<>(prescriptions.stream()
                    .map(this::convertToDTO).collect(Collectors.toList()), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping
    public ResponseEntity<?> createPrescription(@RequestBody PrescriptionDTO dto) {
        try {
            Prescription prescription = prescriptionService.createPrescription(dto);
            return new ResponseEntity<>(convertToDTO(prescription), HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPrescription(@PathVariable String id) {
        try {
            Prescription prescription = prescriptionService.getPrescriptionById(id);
            return new ResponseEntity<>(convertToDTO(prescription), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePrescription(@PathVariable String id, @RequestBody PrescriptionDTO dto) {
        try {
            Prescription prescription = prescriptionService.updatePrescription(id, dto);
            return new ResponseEntity<>(convertToDTO(prescription), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePrescription(@PathVariable String id) {
        try {
            prescriptionService.deletePrescription(id);
            return new ResponseEntity<>(Map.of("message", "Prescription deleted successfully"), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/check-interactions")
    public ResponseEntity<?> checkInteractions(@RequestBody Map<String, List<String>> request) {
        try {
            List<String> medications = request.getOrDefault("medications", new ArrayList<>());
            List<String> allergies = request.getOrDefault("allergies", new ArrayList<>());

            List<String> warnings = new ArrayList<>();
            
            // Simple interaction checking logic
            if (medications.contains("ibuprofen") && medications.contains("aspirin")) {
                warnings.add("Ibuprofen + Aspirin may increase bleeding risk.");
            }
            if (medications.contains("fluconazole") && medications.contains("terbinafine")) {
                warnings.add("Concurrent antifungal therapy may require monitoring.");
            }

            for (String allergy : allergies) {
                for (String med : medications) {
                    if (allergy.toLowerCase().contains(med.toLowerCase()) || med.toLowerCase().contains(allergy.toLowerCase())) {
                        warnings.add("Allergy warning: " + allergy + " ~ " + med);
                    }
                }
            }

            return new ResponseEntity<>(Map.of("warnings", warnings), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{id}/refill")
    public ResponseEntity<?> refillPrescription(@PathVariable String id) {
        try {
            Prescription prescription = prescriptionService.refillPrescription(id);
            return new ResponseEntity<>(convertToDTO(prescription), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
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

    private PrescriptionDTO convertToDTO(Prescription rx) {
        PrescriptionDTO dto = new PrescriptionDTO();
        dto.setId(rx.getId());
        dto.setPatientId(rx.getPatientId());
        dto.setDoctorId(rx.getDoctorId());
        dto.setMedication(rx.getMedication());
        dto.setDosage(rx.getDosage());
        dto.setFrequency(rx.getFrequency());
        dto.setDuration(rx.getDuration());
        dto.setNotes(rx.getNotes());
        dto.setRefillsRemaining(rx.getRefillsRemaining());
        return dto;
    }
}
