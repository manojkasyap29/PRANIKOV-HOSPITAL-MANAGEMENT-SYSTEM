package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import at.favre.lib.crypto.bcrypt.BCrypt;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class PhoneVerificationService {
    private final UserRepository userRepository;
    private final TwilioService twilioService;

    @Value("${otp.dev-mode:false}")
    private boolean devMode;

    public void sendOTP(String userId, String phone) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if OTP was sent recently (within 60 seconds)
        if (user.getPhoneOtpLastSent() != null) {
            long secondsSinceLastSend = java.time.temporal.ChronoUnit.SECONDS
                    .between(user.getPhoneOtpLastSent(), LocalDateTime.now());
            if (secondsSinceLastSend < 60) {
                throw new RuntimeException("OTP recently sent. Please wait before resending.");
            }
        }

        // Generate OTP
        String otp = generateOTP();
        String otpHash = hashOTP(otp);

        // Update user
        user.setPhone(phone);
        user.setPhoneOtpHash(otpHash);
        user.setPhoneOtpExpires(LocalDateTime.now().plusMinutes(10));
        user.setPhoneOtpAttempts(0);
        user.setPhoneOtpLastSent(LocalDateTime.now());

        userRepository.save(user);

        // Send OTP
        if (devMode) {
            System.out.println("[DEV] OTP for user " + userId + " to phone " + phone + ": " + otp);
        } else {
            String smsBody = "Your verification code is " + otp;
            System.out.println("[PhoneVerification] Sending OTP to " + phone + " for user " + userId);
            boolean sent = twilioService.sendSmsViaTwilio(phone, smsBody);
            if (!sent) {
                // Rollback user changes if SMS fails
                user.setPhoneOtpHash(null);
                user.setPhoneOtpExpires(null);
                user.setPhoneOtpLastSent(null);
                userRepository.save(user);
                throw new RuntimeException("Failed to send OTP. Please check your phone number and try again.");
            }
            System.out.println("[PhoneVerification] OTP sent successfully to " + phone);
        }
    }

    public void verifyOTP(String userId, String otp) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getPhoneOtpHash() == null || user.getPhoneOtpExpires() == null) {
            throw new RuntimeException("No active OTP. Please resend.");
        }

        if (LocalDateTime.now().isAfter(user.getPhoneOtpExpires())) {
            user.setPhoneOtpHash(null);
            user.setPhoneOtpExpires(null);
            userRepository.save(user);
            throw new RuntimeException("OTP expired. Please resend.");
        }

        if (user.getPhoneOtpAttempts() != null && user.getPhoneOtpAttempts() >= 5) {
            user.setPhoneOtpHash(null);
            user.setPhoneOtpExpires(null);
            user.setPhoneOtpAttempts(0);
            userRepository.save(user);
            throw new RuntimeException("Too many attempts. OTP reset. Please resend.");
        }

        if (!verifyOTPHash(otp, user.getPhoneOtpHash())) {
            user.setPhoneOtpAttempts((user.getPhoneOtpAttempts() != null ? user.getPhoneOtpAttempts() : 0) + 1);
            userRepository.save(user);
            throw new RuntimeException("Incorrect OTP");
        }

        // Mark as verified
        user.setPhoneVerified(true);
        user.setPhoneOtpHash(null);
        user.setPhoneOtpExpires(null);
        user.setPhoneOtpAttempts(0);
        user.setPhoneOtpLastSent(null);

        userRepository.save(user);
    }

    private String generateOTP() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    private String hashOTP(String otp) {
        return BCrypt.withDefaults().hashToString(12, otp.toCharArray());
    }

    private boolean verifyOTPHash(String otp, String hash) {
        return BCrypt.verifyer().verify(otp.toCharArray(), hash).verified;
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
