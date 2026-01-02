package com.example.demo.service;

import com.example.demo.entity.Assistant;
import com.example.demo.entity.AssistantRun;
import com.example.demo.entity.Appointment;
import com.example.demo.entity.Order;
import com.example.demo.repository.AssistantRepository;
import com.example.demo.repository.AssistantRunRepository;
import com.example.demo.repository.AppointmentRepository;
import com.example.demo.repository.OrderRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AssistantService {
    private final AssistantRepository assistantRepository;
    private final AssistantRunRepository assistantRunRepository;
    private final AppointmentRepository appointmentRepository;
    private final OrderRepository orderRepository;

    public Assistant createAssistant(String name, String description, Map<String, Boolean> skills) {
        Assistant assistant = new Assistant();
        assistant.setId(UUID.randomUUID().toString());
        assistant.setName(name);
        assistant.setDescription(description);
        assistant.setEnabled(true);
        
        ObjectMapper mapper = new ObjectMapper();
        assistant.setSkills(mapper.valueToTree(skills != null ? skills : 
                Map.of("appointments_review", true, "orders_review", true)));
        
        return assistantRepository.save(assistant);
    }

    public AssistantRun executeTask(String assistantId, String task) {
        Assistant assistant = assistantRepository.findById(assistantId)
                .orElseThrow(() -> new RuntimeException("Assistant not found or disabled"));
        
        if (!assistant.getEnabled()) {
            throw new RuntimeException("Assistant is disabled");
        }

        if (assistant.getSkills() != null && !assistant.getSkills().get(task).asBoolean()) {
            throw new RuntimeException("Assistant does not have skill: " + task);
        }

        Map<String, Object> result = new HashMap<>();

        if ("appointments_review".equals(task)) {
            result = executeAppointmentsReview();
        } else if ("orders_review".equals(task)) {
            result = executeOrdersReview();
        } else if ("waiting_list_confirm".equals(task)) {
            result = executeWaitingListConfirm();
        } else if ("appointments_reschedule".equals(task)) {
            result = executeAppointmentsReschedule();
        } else if ("orders_followup".equals(task)) {
            result = executeOrdersFollowup();
        } else if ("phone_verification_review".equals(task)) {
            result = executePhoneVerificationReview();
        } else {
            throw new RuntimeException("Unknown task: " + task);
        }

        AssistantRun run = new AssistantRun();
        run.setId(UUID.randomUUID().toString());
        run.setAssistantId(assistantId);
        run.setTask(task);
        run.setStatus("completed");
        ObjectMapper mapper = new ObjectMapper();
        run.setResult(mapper.valueToTree(result));

        return assistantRunRepository.save(run);
    }

    private Map<String, Object> executeAppointmentsReview() {
        List<Appointment> appointments = appointmentRepository.findAll();
        Map<String, Integer> byStatus = new HashMap<>();
        List<Map<String, Object>> upcoming = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (Appointment apt : appointments) {
            byStatus.put(apt.getStatus(), byStatus.getOrDefault(apt.getStatus(), 0) + 1);
            
            try {
                if (apt.getDate() != null && apt.getDate().isAfter(today) && 
                    apt.getDate().isBefore(today.plusDays(8))) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", apt.getId());
                    item.put("date", apt.getDate().toString());
                    item.put("time", apt.getTime());
                    item.put("patientName", apt.getPatient() != null ? apt.getPatient().getName() : "Unknown");
                    item.put("doctorName", apt.getDoctor() != null ? apt.getDoctor().getName() : "Unknown");
                    upcoming.add(item);
                }
            } catch (Exception e) {
                // Skip malformed dates
            }
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("total", appointments.size());
        summary.put("byStatus", byStatus);
        summary.put("upcoming7d", upcoming);

        List<String> suggestions = Arrays.asList(
                "Confirm upcoming appointments within 48 hours.",
                "Follow up on cancelled appointments for rescheduling."
        );

        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("suggestions", suggestions);
        return result;
    }

    private Map<String, Object> executeOrdersReview() {
        List<Order> orders = orderRepository.findAll();
        Map<String, Integer> byStatus = new HashMap<>();
        List<Map<String, Object>> delayed = new ArrayList<>();
        List<Map<String, Object>> pendingProcessing = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (Order order : orders) {
            byStatus.put(order.getStatus(), byStatus.getOrDefault(order.getStatus(), 0) + 1);

            try {
                LocalDateTime created = order.getCreatedAt() != null ? order.getCreatedAt() : LocalDateTime.now();
                long ageDays = java.time.temporal.ChronoUnit.DAYS.between(created, now);
                
                Map<String, Object> details = new HashMap<>();
                details.put("id", order.getId());
                details.put("ageDays", ageDays);
                details.put("status", order.getStatus());
                details.put("total", order.getTotal());
                details.put("userId", order.getUserId());
                details.put("userName", order.getUser() != null ? order.getUser().getName() : null);
                details.put("userPhone", order.getUser() != null ? order.getUser().getPhone() : null);

                if ("pending".equals(order.getStatus()) || "processing".equals(order.getStatus())) {
                    pendingProcessing.add(details);
                    if (ageDays > 2) {
                        delayed.add(details);
                    }
                }
            } catch (Exception e) {
                // Skip malformed orders
            }
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("total", orders.size());
        summary.put("byStatus", byStatus);
        summary.put("delayed", delayed);
        summary.put("pendingProcessing", pendingProcessing);

        List<String> suggestions = Arrays.asList(
                "Prioritize delayed orders older than 2 days.",
                "Notify customers of shipping updates."
        );

        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("suggestions", suggestions);
        return result;
    }

    private Map<String, Object> executeWaitingListConfirm() {
        List<Appointment> waiting = appointmentRepository.findByStatus("waiting");
        List<Map<String, Object>> items = new ArrayList<>();
        Map<String, Integer> byDoctor = new HashMap<>();

        for (Appointment apt : waiting) {
            byDoctor.put(apt.getDoctorId(), byDoctor.getOrDefault(apt.getDoctorId(), 0) + 1);
            
            Map<String, Object> item = new HashMap<>();
            item.put("appointmentId", apt.getId());
            item.put("patientName", apt.getPatient().getName());
            item.put("phone", apt.getPatient().getPhone());
            item.put("doctorName", apt.getDoctor().getName());
            item.put("date", apt.getDate().toString());
            item.put("time", apt.getTime());
            items.add(item);
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalWaiting", waiting.size());
        summary.put("byDoctor", byDoctor);

        Map<String, Object> actions = new HashMap<>();
        actions.put("sendConfirmations", items);

        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("actions", actions);
        return result;
    }

    private Map<String, Object> executeAppointmentsReschedule() {
        List<Appointment> cancelled = appointmentRepository.findByStatus("cancelled");
        List<Map<String, Object>> suggestions = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (Appointment apt : cancelled) {
            List<Map<String, Object>> dayOptions = new ArrayList<>();
            
            for (int offset = 1; offset <= 7; offset++) {
                LocalDate day = today.plusDays(offset);
                List<Appointment> appts = appointmentRepository.findByDoctorIdAndDate(apt.getDoctorId(), day);
                Set<String> occupied = new HashSet<>();
                
                for (Appointment ap : appts) {
                    if (ap.getStatus() != null && !ap.getStatus().equals("cancelled")) {
                        occupied.add(ap.getTime());
                    }
                }

                List<String> slots = new ArrayList<>();
                for (int hour = 9; hour < 17; hour++) {
                    for (int min = 0; min < 60; min += 30) {
                        String hhmm = String.format("%02d:%02d", hour, min);
                        if (!occupied.contains(hhmm)) {
                            slots.add(hhmm);
                        }
                    }
                    if (slots.size() >= 6) break;
                }

                if (!slots.isEmpty()) {
                    Map<String, Object> dayOption = new HashMap<>();
                    dayOption.put("date", day.toString());
                    dayOption.put("slots", slots.subList(0, Math.min(6, slots.size())));
                    dayOptions.add(dayOption);
                }
            }

            Map<String, Object> suggestion = new HashMap<>();
            suggestion.put("appointmentId", apt.getId());
            suggestion.put("patientName", apt.getPatient().getName());
            suggestion.put("phone", apt.getPatient().getPhone());
            suggestion.put("doctorName", apt.getDoctor().getName());
            suggestion.put("rescheduleOptions", dayOptions);
            suggestions.add(suggestion);
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalCancelled", cancelled.size());

        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("suggestions", suggestions);
        return result;
    }

    private Map<String, Object> executeOrdersFollowup() {
        List<Order> orders = orderRepository.findAll();
        List<Map<String, Object>> followups = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (Order order : orders) {
            if ("pending".equals(order.getStatus()) || "processing".equals(order.getStatus())) {
                LocalDateTime created = order.getCreatedAt() != null ? order.getCreatedAt() : now;
                long ageDays = java.time.temporal.ChronoUnit.DAYS.between(created, now);
                
                if (ageDays >= 3) {
                    Map<String, Object> followup = new HashMap<>();
                    followup.put("orderId", order.getId());
                    followup.put("userId", order.getUserId());
                    followup.put("phone", order.getUser() != null ? order.getUser().getPhone() : null);
                    followup.put("ageDays", ageDays);
                    followup.put("status", order.getStatus());
                    followups.add(followup);
                }
            }
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalFollowups", followups.size());

        Map<String, Object> actions = new HashMap<>();
        actions.put("sendOrderFollowups", followups);

        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("actions", actions);
        return result;
    }

    private Map<String, Object> executePhoneVerificationReview() {
        // Implementation would require UserRepository access
        Map<String, Object> result = new HashMap<>();
        result.put("summary", Map.of("unverifiedCount", 0));
        result.put("actions", Map.of("sendVerificationReminders", new ArrayList<>()));
        return result;
    }
}
