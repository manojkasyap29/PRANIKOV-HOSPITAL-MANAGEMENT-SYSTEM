package com.example.demo.service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.example.demo.dto.HealthRecordDTO;
import com.example.demo.entity.HealthRecord;
import com.example.demo.event.HealthRecordEvent;
import com.example.demo.kafka.producer.HealthRecordProducer;
import com.example.demo.repository.HealthRecordRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HealthRecordService {
    private final HealthRecordRepository healthRecordRepository;
    private final HealthRecordProducer healthRecordProducer;

    public HealthRecord createHealthRecord(HealthRecordDTO dto) {
        HealthRecord record = new HealthRecord();
        record.setId(UUID.randomUUID().toString());
        record.setPatientId(dto.getPatientId());
        record.setDoctorId(dto.getDoctorId());
        record.setType(dto.getType());
        record.setDescription(dto.getDescription());
        record.setAttachments(dto.getAttachments());
        record.setDate(LocalDate.now());

        HealthRecord saved = healthRecordRepository.save(record);

        // Publish health record created event to Kafka
        HealthRecordEvent event = HealthRecordEvent.builder()
                .recordId(saved.getId())
                .patientId(saved.getPatientId())
                .doctorId(saved.getDoctorId())
                .recordType(saved.getType())
                .description(saved.getDescription())
                .recordDate(saved.getDate())
                .action("created")
                .build();
        healthRecordProducer.publishHealthRecordEvent(event);

        return saved;
    }

    public HealthRecord getHealthRecordById(String id) {
        return healthRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Health record not found"));
    }

    public List<HealthRecord> getHealthRecordsByPatient(String patientId) {
        return healthRecordRepository.findByPatientId(patientId);
    }

    public List<HealthRecord> getHealthRecordsByDoctor(String doctorId) {
        return healthRecordRepository.findByDoctorId(doctorId);
    }

    public List<HealthRecord> getAllHealthRecords() {
        return healthRecordRepository.findAll();
    }

    public HealthRecord updateHealthRecord(String id, HealthRecordDTO dto) {
        HealthRecord record = getHealthRecordById(id);

        if (dto.getType() != null) {
            record.setType(dto.getType());
        }
        if (dto.getDescription() != null) {
            record.setDescription(dto.getDescription());
        }
        if (dto.getAttachments() != null) {
            record.setAttachments(dto.getAttachments());
        }

        HealthRecord updated = healthRecordRepository.save(record);

        // Publish health record updated event to Kafka
        HealthRecordEvent event = HealthRecordEvent.builder()
                .recordId(updated.getId())
                .patientId(updated.getPatientId())
                .doctorId(updated.getDoctorId())
                .recordType(updated.getType())
                .description(updated.getDescription())
                .recordDate(updated.getDate())
                .action("updated")
                .build();
        healthRecordProducer.publishHealthRecordEvent(event);

        return updated;
    }

    public void deleteHealthRecord(String id) {
        healthRecordRepository.deleteById(id);
    }
}
