package com.example.demo.service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.example.demo.dto.PrescriptionDTO;
import com.example.demo.entity.Prescription;
import com.example.demo.event.PrescriptionEvent;
import com.example.demo.kafka.producer.PrescriptionProducer;
import com.example.demo.repository.PrescriptionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PrescriptionService {
    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionProducer prescriptionProducer;

    public Prescription createPrescription(PrescriptionDTO dto) {
        Prescription prescription = new Prescription();
        prescription.setId(UUID.randomUUID().toString());
        prescription.setPatientId(dto.getPatientId());
        prescription.setDoctorId(dto.getDoctorId());
        prescription.setMedication(dto.getMedication());
        prescription.setDosage(dto.getDosage());
        prescription.setFrequency(dto.getFrequency());
        prescription.setDuration(dto.getDuration());
        prescription.setNotes(dto.getNotes());
        prescription.setDate(LocalDate.now());

        Prescription saved = prescriptionRepository.save(prescription);

        // Publish prescription created event to Kafka
        PrescriptionEvent event = PrescriptionEvent.builder()
                .prescriptionId(saved.getId())
                .patientId(saved.getPatientId())
                .doctorId(saved.getDoctorId())
                .medication(saved.getMedication())
                .dosage(saved.getDosage())
                .frequency(saved.getFrequency())
                .startDate(saved.getDate())
                .status("active")
                .action("created")
                .build();
        prescriptionProducer.publishPrescriptionEvent(event);

        return saved;
    }

    public Prescription getPrescriptionById(String id) {
        return prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));
    }

    public List<Prescription> getPrescriptionsByPatient(String patientId) {
        return prescriptionRepository.findByPatientId(patientId);
    }

    public List<Prescription> getPrescriptionsByDoctor(String doctorId) {
        return prescriptionRepository.findByDoctorId(doctorId);
    }

    public List<Prescription> getAllPrescriptions() {
        return prescriptionRepository.findAll();
    }

    public Prescription updatePrescription(String id, PrescriptionDTO dto) {
        Prescription prescription = getPrescriptionById(id);

        if (dto.getMedication() != null) {
            prescription.setMedication(dto.getMedication());
        }
        if (dto.getDosage() != null) {
            prescription.setDosage(dto.getDosage());
        }
        if (dto.getFrequency() != null) {
            prescription.setFrequency(dto.getFrequency());
        }
        if (dto.getDuration() != null) {
            prescription.setDuration(dto.getDuration());
        }
        if (dto.getNotes() != null) {
            prescription.setNotes(dto.getNotes());
        }

        Prescription updated = prescriptionRepository.save(prescription);

        // Publish prescription updated event to Kafka
        PrescriptionEvent event = PrescriptionEvent.builder()
                .prescriptionId(updated.getId())
                .patientId(updated.getPatientId())
                .doctorId(updated.getDoctorId())
                .medication(updated.getMedication())
                .dosage(updated.getDosage())
                .frequency(updated.getFrequency())
                .startDate(updated.getDate())
                .status("active")
                .action("updated")
                .build();
        prescriptionProducer.publishPrescriptionEvent(event);

        return updated;
    }

    public void deletePrescription(String id) {
        Prescription prescription = getPrescriptionById(id);
        prescriptionRepository.deleteById(id);

        // Publish prescription cancelled event to Kafka
        PrescriptionEvent event = PrescriptionEvent.builder()
                .prescriptionId(prescription.getId())
                .patientId(prescription.getPatientId())
                .doctorId(prescription.getDoctorId())
                .status("cancelled")
                .action("cancelled")
                .build();
        prescriptionProducer.publishPrescriptionEvent(event);
    }

    public Prescription refillPrescription(String id) {
        Prescription prescription = getPrescriptionById(id);
        
        if (prescription.getRefillsRemaining() == null || prescription.getRefillsRemaining() <= 0) {
            throw new RuntimeException("No refills remaining");
        }

        prescription.setRefillsRemaining(prescription.getRefillsRemaining() - 1);
        return prescriptionRepository.save(prescription);
    }
}
