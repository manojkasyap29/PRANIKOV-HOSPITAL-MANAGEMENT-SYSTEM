package com.example.demo.controller;

import com.example.demo.dto.PhoneOtpRequest;
import com.example.demo.entity.User;
import com.example.demo.service.PhoneVerificationService;
import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/phone")
@RequiredArgsConstructor
@Slf4j
public class PhoneVerificationController {
    private final PhoneVerificationService phoneVerificationService;
    private final UserService userService;

    @GetMapping("/status")
    public ResponseEntity<?> getStatus() {
        try {
            String userId = getCurrentUserId();
            User user = userService.getUserById(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("phone", user.getPhone());
            response.put("verified", user.getPhoneVerified());
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOTP(@RequestBody PhoneOtpRequest request) {
        try {
            log.info("🔵 SEND OTP ENDPOINT CALLED");
            String userId = getCurrentUserId();
            log.info("  ✓ userId={}", userId);
            
            String phone = request.getPhone();
            log.info("  ✓ request.phone={}", phone);
            
            if (phone == null || phone.isEmpty()) {
                User user = userService.getUserById(userId);
                phone = user.getPhone();
                log.info("  ✓ phone from database={}", phone);
            }
            
            if (phone == null || phone.isEmpty()) {
                log.warn("  ✗ Phone number is null or empty");
                return new ResponseEntity<>(Map.of("message", "Phone number required"), HttpStatus.BAD_REQUEST);
            }

            // Validate phone
            String digits = phone.replaceAll("[^0-9]", "");
            if (digits.length() < 10 || digits.length() > 15) {
                log.warn("  ✗ Invalid phone length: {} digits", digits.length());
                return new ResponseEntity<>(Map.of("message", "Invalid phone number"), HttpStatus.BAD_REQUEST);
            }

            log.info("  ⏳ Calling phoneVerificationService.sendOTP()");
            phoneVerificationService.sendOTP(userId, phone);
            log.info("🟢 OTP SENT SUCCESSFULLY");
            return new ResponseEntity<>(Map.of("message", "OTP sent"), HttpStatus.OK);
        } catch (Exception e) {
            log.error("❌ ERROR in sendOTP: {}", e.getMessage(), e);
            if ("OTP recently sent".contains(e.getMessage())) {
                return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.TOO_MANY_REQUESTS);
            }
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOTP(@RequestBody PhoneOtpRequest request) {
        try {
            String userId = getCurrentUserId();
            String otp = request.getOtp();

            if (otp == null || !otp.matches("\\d{6}")) {
                return new ResponseEntity<>(Map.of("message", "Invalid OTP format"), HttpStatus.BAD_REQUEST);
            }

            phoneVerificationService.verifyOTP(userId, otp);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Phone verified");
            response.put("verified", true);
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            if ("Too many attempts".contains(e.getMessage())) {
                return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.TOO_MANY_REQUESTS);
            }
            int status = "Incorrect OTP".equals(e.getMessage()) ? 401 : 400;
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.valueOf(status));
        }
    }

    @RequestMapping(value = "/verify-otp", method = RequestMethod.OPTIONS)
    public ResponseEntity<?> verifyOTPOptions() {
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    protected String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (String) auth.getPrincipal();
    }
}
