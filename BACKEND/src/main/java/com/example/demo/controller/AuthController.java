package com.example.demo.controller;

import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.UserDTO;
import com.example.demo.entity.User;
import com.example.demo.service.JwtService;
import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody UserDTO userDTO) {
        try {
            User user = userService.registerUser(userDTO);
            String token = jwtService.generateToken(user);

            AuthResponse response = new AuthResponse();
            response.setToken(token);
            response.setUser(convertToDTO(user));

            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            AuthResponse response = new AuthResponse();
            response.setMessage(e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody UserDTO userDTO) {
        try {
            User user = userService.loginUser(userDTO.getEmail(), userDTO.getPassword());
            String token = jwtService.generateToken(user);

            AuthResponse response = new AuthResponse();
            response.setToken(token);
            response.setUser(convertToDTO(user));

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            AuthResponse response = new AuthResponse();
            response.setMessage(e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        try {
            String userId = getCurrentUserId();
            User user = userService.getUserById(userId);
            return new ResponseEntity<>(convertToDTO(user), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UserDTO userDTO) {
        try {
            String userId = getCurrentUserId();
            User user = userService.updateUser(userId, userDTO);
            return new ResponseEntity<>(convertToDTO(user), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/profile/avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("avatar") MultipartFile file) {
        try {
            String userId = getCurrentUserId();
            
            if (file.isEmpty()) {
                return new ResponseEntity<>(Map.of("message", "No file provided"), HttpStatus.BAD_REQUEST);
            }

            // Validate file extension
            String filename = file.getOriginalFilename();
            if (!isAllowedImageExtension(filename)) {
                return new ResponseEntity<>(Map.of("message", "Unsupported file type"), HttpStatus.BAD_REQUEST);
            }

            // Create upload directory
            String uploadDir = "static/Uploads";
            Path uploadPath = Paths.get(uploadDir);
            Files.createDirectories(uploadPath);

            // Save file with timestamp
            String timestamp = String.valueOf(System.currentTimeMillis());
            String fileExtension = filename.substring(filename.lastIndexOf("."));
            String finalFilename = "avatar_" + userId + "_" + timestamp + fileExtension.toLowerCase();
            Path filePath = uploadPath.resolve(finalFilename);
            
            Files.write(filePath, file.getBytes());

            // Update user
            String imageUrl = "/static/Uploads/" + finalFilename;
            User user = userService.updateUserImage(userId, imageUrl);

            Map<String, Object> response = new HashMap<>();
            response.put("imageUrl", imageUrl);
            response.put("user", convertToDTO(user));

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IOException e) {
            return new ResponseEntity<>(Map.of("message", "Failed to upload file"), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private boolean isAllowedImageExtension(String filename) {
        if (filename == null) return false;
        String lowerName = filename.toLowerCase();
        return lowerName.endsWith(".png") || lowerName.endsWith(".jpg") || 
               lowerName.endsWith(".jpeg") || lowerName.endsWith(".gif") || 
               lowerName.endsWith(".webp");
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
        dto.setPhoneVerified(user.getPhoneVerified());
        dto.setDateOfBirth(user.getDateOfBirth());
        dto.setAddress(user.getAddress());
        dto.setSpecialization(user.getSpecialization());
        dto.setLicense(user.getLicense());
        dto.setImageUrl(user.getImageUrl());
        return dto;
    }
}
