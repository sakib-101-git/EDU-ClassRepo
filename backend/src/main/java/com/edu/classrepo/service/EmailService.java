package com.edu.classrepo.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    @Async
    public void sendOtp(String toEmail, String otp) {
        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, "UTF-8");
            helper.setFrom("EDU ClassRepo <" + fromAddress + ">");
            helper.setTo(toEmail);
            helper.setSubject("Your EDU ClassRepo verification code: " + otp);
            helper.setText(buildOtpHtml(otp), true);
            mailSender.send(mime);
            log.info("OTP sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Could not send verification email. Please try again.");
        }
    }

    private String buildOtpHtml(String otp) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
                <tr><td align="center">
                  <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                    <tr>
                      <td style="background:linear-gradient(135deg,#6B1515,#8B2020);padding:32px 40px;text-align:center;">
                        <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">EDU ClassRepo</p>
                        <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:12px;">A one stop solution for EDU Students</p>
                        <p style="margin:4px 0 0;color:rgba(255,255,255,0.55);font-size:12px;">Email Verification</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px 40px 32px;">
                        <p style="margin:0 0 16px;color:#111827;font-size:16px;line-height:1.6;">
                          Use the verification code below to complete your registration.
                          It expires in <strong>10 minutes</strong>.
                        </p>
                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                          <tr>
                            <td align="center" style="background:#fdf8f0;border:2px solid #C9972C;border-radius:10px;padding:24px 0;">
                              <span style="font-size:42px;font-weight:800;letter-spacing:12px;color:#6B1515;font-family:monospace;">%s</span>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                          If you did not create an account on EDU ClassRepo, you can safely ignore this email.
                          Do not share this code with anyone.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
                        <p style="margin:0;color:#9ca3af;font-size:12px;">East Delta University Academic Hub &bull; Chittagong, Bangladesh</p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(otp);
    }
}
