package com.example.demo.repository;

import com.example.demo.entity.HealthRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HealthRecordRepository extends JpaRepository<HealthRecord, String> {
    List<HealthRecord> findByPatientId(String patientId);
    List<HealthRecord> findByDoctorId(String doctorId);
}
