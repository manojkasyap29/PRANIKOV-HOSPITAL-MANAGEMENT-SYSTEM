package com.example.demo.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.util.Base64;

/**
 * Service for generating QR codes for payments
 * Used for payment collection via UPI, Stripe, PayPal, etc.
 */
@Service
@RequiredArgsConstructor
public class QRCodeService {

    @Value("${app.payment.qr-size:300}")
    private int qrSize;

    /**
     * Generate QR code for UPI payment
     * Format: upi://pay?pa=upiid@bank&pn=name&am=amount&tn=description
     */
    public String generateUPIQRCode(String upiId, String payeeName, Double amount, String orderId) {
        try {
            String upiString = String.format(
                    "upi://pay?pa=%s&pn=%s&am=%.2f&tn=Order%%20%s",
                    upiId,
                    payeeName.replace(" ", "%%20"),
                    amount,
                    orderId
            );
            return generateQRCode(upiString);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate UPI QR code: " + e.getMessage());
        }
    }

    /**
     * Generate QR code for payment link (e.g., Stripe, PayPal)
     */
    public String generatePaymentLinkQRCode(String paymentUrl) {
        try {
            return generateQRCode(paymentUrl);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate payment link QR code: " + e.getMessage());
        }
    }

    /**
     * Generate generic QR code from any text
     * Returns Base64 encoded PNG image
     */
    private String generateQRCode(String qrCodeText) throws Exception {
        MultiFormatWriter writer = new MultiFormatWriter();
        BitMatrix bitMatrix = writer.encode(qrCodeText, BarcodeFormat.QR_CODE, qrSize, qrSize);

        ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);

        byte[] qrCodeBytes = pngOutputStream.toByteArray();
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(qrCodeBytes);
    }

    /**
     * Generate QR code as Base64 string (for embedding in JSON responses)
     */
    public String generateQRCodeBase64(String data) {
        try {
            return generateQRCode(data);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR code: " + e.getMessage());
        }
    }
}
