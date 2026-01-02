package com.example.demo.controller;

import com.example.demo.service.AssistantService;
import com.example.demo.entity.Assistant;
import com.example.demo.entity.AssistantRun;
import com.example.demo.dto.AssistantDTO;
import com.example.demo.repository.AssistantRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/assistants")
@RequiredArgsConstructor
public class AssistantController {
    private final AssistantService assistantService;
    private final AssistantRepository assistantRepository;

    @GetMapping
    public ResponseEntity<?> listAssistants() {
        try {
            if (!isAdmin()) {
                return new ResponseEntity<>(Map.of("message", "Unauthorized"), HttpStatus.FORBIDDEN);
            }

            List<Assistant> assistants = assistantRepository.findAll();
            return new ResponseEntity<>(assistants.stream()
                    .map(this::convertToDTO).collect(Collectors.toList()), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping
    public ResponseEntity<?> createAssistant(@RequestBody AssistantDTO dto) {
        try {
            if (!isAdmin()) {
                return new ResponseEntity<>(Map.of("message", "Unauthorized"), HttpStatus.FORBIDDEN);
            }

            String name = dto.getName();
            if (name == null || name.isEmpty()) {
                return new ResponseEntity<>(Map.of("message", "name is required"), HttpStatus.BAD_REQUEST);
            }

            ObjectMapper mapper = new ObjectMapper();
            Map<String, Boolean> skills = mapper.convertValue(dto.getSkills() != null ? dto.getSkills() : 
                    mapper.valueToTree(Map.of("appointments_review", true, "orders_review", true)), 
                    Map.class);

            Assistant assistant = assistantService.createAssistant(name, dto.getDescription(), skills);
            return new ResponseEntity<>(convertToDTO(assistant), HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{assistantId}/run")
    public ResponseEntity<?> runTask(@PathVariable String assistantId, @RequestBody Map<String, String> request) {
        try {
            if (!isAdmin()) {
                return new ResponseEntity<>(Map.of("message", "Unauthorized"), HttpStatus.FORBIDDEN);
            }

            String task = request.get("task");
            if (task == null || task.isEmpty()) {
                return new ResponseEntity<>(Map.of("message", "task is required"), HttpStatus.BAD_REQUEST);
            }

            AssistantRun run = assistantService.executeTask(assistantId, task);
            return new ResponseEntity<>(run, HttpStatus.OK);
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

    protected boolean isAdmin() {
        return "admin".equals(getCurrentUserRole());
    }

    private AssistantDTO convertToDTO(Assistant assistant) {
        AssistantDTO dto = new AssistantDTO();
        dto.setId(assistant.getId());
        dto.setName(assistant.getName());
        dto.setDescription(assistant.getDescription());
        dto.setEnabled(assistant.getEnabled());
        dto.setSkills(assistant.getSkills());
        return dto;
    }
}
