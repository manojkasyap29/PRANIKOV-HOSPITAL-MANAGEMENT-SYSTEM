package com.example.demo.controller;

import com.example.demo.dto.HealthRecordDTO;
import com.example.demo.entity.HealthRecord;
import com.example.demo.service.HealthRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/health-records")
@RequiredArgsConstructor
public class HealthRecordController {
    private final HealthRecordService healthRecordService;

    @GetMapping
    public ResponseEntity<?> getHealthRecords() {
        try {
            String userId = getCurrentUserId();
            String userRole = getCurrentUserRole();
            List<HealthRecord> records;
            
            if ("patient".equals(userRole)) {
                records = healthRecordService.getHealthRecordsByPatient(userId);
            } else {
                records = healthRecordService.getAllHealthRecords();
            }
            return new ResponseEntity<>(records.stream()
                    .map(this::convertToDTO).collect(Collectors.toList()), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping
    public ResponseEntity<?> createHealthRecord(@RequestBody HealthRecordDTO dto) {
        try {
            HealthRecord record = healthRecordService.createHealthRecord(dto);
            return new ResponseEntity<>(convertToDTO(record), HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getHealthRecord(@PathVariable String id) {
        try {
            HealthRecord record = healthRecordService.getHealthRecordById(id);
            return new ResponseEntity<>(convertToDTO(record), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateHealthRecord(@PathVariable String id, @RequestBody HealthRecordDTO dto) {
        try {
            HealthRecord record = healthRecordService.updateHealthRecord(id, dto);
            return new ResponseEntity<>(convertToDTO(record), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHealthRecord(@PathVariable String id) {
        try {
            healthRecordService.deleteHealthRecord(id);
            return new ResponseEntity<>(Map.of("message", "Health record deleted successfully"), HttpStatus.OK);
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

    private HealthRecordDTO convertToDTO(HealthRecord record) {
        HealthRecordDTO dto = new HealthRecordDTO();
        dto.setId(record.getId());
        dto.setPatientId(record.getPatientId());
        dto.setDoctorId(record.getDoctorId());
        dto.setType(record.getType());
        dto.setDescription(record.getDescription());
        dto.setAttachments(record.getAttachments());
        return dto;
    }
}
