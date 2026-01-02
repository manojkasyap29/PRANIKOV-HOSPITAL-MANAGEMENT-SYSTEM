package com.example.demo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.InitializingBean;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import java.util.Optional;
import java.util.concurrent.*;

@Service
@RequiredArgsConstructor
public class TwilioService implements InitializingBean {
    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.phone-number:}")
    private String twilioPhoneNumber;

    @Value("${twilio.messaging-service-sid:}")
    private String messagingServiceSid;

    @Value("${default.country.code:+91}")
    private String defaultCountryCode;

    private boolean isInitialized = false;
    
    // DEADLOCK FIX: Executor for SMS sending with timeout protection
    private final ExecutorService smsExecutor = Executors.newFixedThreadPool(5, r -> {
        Thread t = new Thread(r, "TwilioSender-" + Thread.currentThread().getId());
        t.setDaemon(false);
        return t;
    });

    @Override
    public void afterPropertiesSet() throws Exception {
        if (accountSid != null && !accountSid.isEmpty() && authToken != null && !authToken.isEmpty()) {
            com.twilio.Twilio.init(accountSid, authToken);
            isInitialized = true;
            System.out.println("[Twilio] Initialized successfully with Account SID: " + accountSid.substring(0, Math.min(4, accountSid.length())) + "...");
        } else {
            System.err.println("[Twilio] WARNING: Credentials not configured. SMS sending will fail.");
        }
    }

    public boolean sendSmsViaTwilio(String toPhone, String body) {
        try {
            if (!isInitialized) {
                System.err.println("[Twilio] Not initialized. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");
                return false;
            }

            String toE164 = normalizePhoneE164(toPhone);
            if (toE164 == null) {
                System.err.println("[Twilio] Failed to normalize phone: " + toPhone);
                return false;
            }

            System.out.println("[Twilio] Sending SMS to: " + toE164 + " | Body: " + body.substring(0, Math.min(50, body.length())));

            // DEADLOCK FIX: Execute SMS send in separate thread with 10-second timeout
            // If Twilio is slow or stuck, this returns false instead of blocking Kafka listener
            Future<Boolean> result = smsExecutor.submit(() -> {
                try {
                    if (messagingServiceSid != null && !messagingServiceSid.isEmpty()) {
                        Message message = Message.creator(
                                new PhoneNumber(toE164),
                                messagingServiceSid,
                                body
                        ).create();
                        System.out.println("[Twilio] SMS sent successfully via Messaging Service. SID: " + message.getSid());
                        return true;
                    } else if (twilioPhoneNumber != null && !twilioPhoneNumber.isEmpty()) {
                        Message message = Message.creator(
                                new PhoneNumber(toE164),
                                new PhoneNumber(twilioPhoneNumber),
                                body
                        ).create();
                        System.out.println("[Twilio] SMS sent successfully from: " + twilioPhoneNumber + " to " + toE164 + " | SID: " + message.getSid());
                        return true;
                    } else {
                        System.err.println("[Twilio] Neither Messaging Service SID nor Phone Number configured");
                        return false;
                    }
                } catch (Exception e) {
                    System.err.println("[Twilio] SMS send failed: " + e.getMessage());
                    return false;
                }
            });

            // DEADLOCK FIX: Wait maximum 10 seconds for SMS to send
            // If Twilio doesn't respond, we timeout and free the thread
            try {
                return result.get(10, TimeUnit.SECONDS);
            } catch (TimeoutException e) {
                System.err.println("[Twilio] SMS send TIMEOUT after 10 seconds to: " + toE164);
                result.cancel(true);
                return false;
            } catch (ExecutionException | InterruptedException e) {
                System.err.println("[Twilio] SMS send interrupted/error: " + e.getMessage());
                return false;
            }
        } catch (Exception e) {
            System.err.println("[Twilio] Unexpected error in sendSmsViaTwilio: " + e.getMessage());
            return false;
        }
    }


    public String normalizePhoneE164(String phone) {
        if (phone == null || phone.isEmpty()) {
            System.err.println("[Twilio] Phone number is null or empty");
            return null;
        }

        phone = phone.trim();
        if (phone.startsWith("+")) {
            return phone;
        }

        // Extract only digits
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.isEmpty()) {
            System.err.println("[Twilio] No digits found in phone: " + phone);
            return null;
        }

        if (defaultCountryCode != null && !defaultCountryCode.isEmpty()) {
            String cc = defaultCountryCode.trim();
            if (cc.startsWith("+")) {
                String result = cc + digits;
                System.out.println("[Twilio] Normalized phone (with country code): " + result);
                return result;
            } else {
                String result = "+" + cc + digits;
                System.out.println("[Twilio] Normalized phone (with country code): " + result);
                return result;
            }
        }

        String result = "+" + digits;
        System.out.println("[Twilio] Normalized phone (default): " + result);
        return result;
    }

    public Optional<com.twilio.rest.api.v2010.account.Message> receiveSms(String fromNumber, String toNumber, String body) {
        // This is typically called from the webhook
        System.out.println("[Twilio SMS] From=" + fromNumber + " To=" + toNumber + " Body=" + body);
        return Optional.empty();
    }
}