package com.edu.classrepo.controller;

import com.edu.classrepo.dto.request.LoginRequest;
import com.edu.classrepo.dto.request.OtpVerifyRequest;
import com.edu.classrepo.dto.request.RegisterRequest;
import com.edu.classrepo.dto.request.ResendOtpRequest;
import com.edu.classrepo.dto.response.AuthResponse;
import com.edu.classrepo.dto.response.OtpSentResponse;
import com.edu.classrepo.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<OtpSentResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<AuthResponse> verifyEmail(@Valid @RequestBody OtpVerifyRequest req) {
        return ResponseEntity.ok(authService.verifyEmail(req));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<OtpSentResponse> resendOtp(@Valid @RequestBody ResendOtpRequest req) {
        return ResponseEntity.ok(authService.resendOtp(req.getEmail()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body.getOrDefault("refreshToken", "");
        return ResponseEntity.ok(authService.refresh(refreshToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody(required = false) Map<String, String> body) {
        if (body != null) {
            authService.logout(body.getOrDefault("refreshToken", ""));
        }
        return ResponseEntity.noContent().build();
    }
}
