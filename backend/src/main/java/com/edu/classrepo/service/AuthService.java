package com.edu.classrepo.service;

import com.edu.classrepo.dto.request.LoginRequest;
import com.edu.classrepo.dto.request.OtpVerifyRequest;
import com.edu.classrepo.dto.request.RegisterRequest;
import com.edu.classrepo.dto.response.AuthResponse;
import com.edu.classrepo.dto.response.OtpSentResponse;
import com.edu.classrepo.entity.OtpToken;
import com.edu.classrepo.entity.RefreshToken;
import com.edu.classrepo.entity.User;
import com.edu.classrepo.exception.BadRequestException;
import com.edu.classrepo.exception.ConflictException;
import com.edu.classrepo.repository.DepartmentRepository;
import com.edu.classrepo.repository.OtpTokenRepository;
import com.edu.classrepo.repository.RefreshTokenRepository;
import com.edu.classrepo.repository.UserRepository;
import com.edu.classrepo.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OtpTokenRepository otpTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Value("${app.email.allowed-domain}")
    private String allowedDomain;

    @Transactional
    public OtpSentResponse register(RegisterRequest req) {
        String email = req.getEmail().toLowerCase().trim();

        if (!email.endsWith("@" + allowedDomain)) {
            throw new BadRequestException("Only @" + allowedDomain + " emails are allowed");
        }
        if (userRepository.existsByEmail(email)) {
            var existing = userRepository.findByEmail(email).orElseThrow();
            if (existing.isEmailVerified()) {
                throw new ConflictException("An account with this email already exists");
            }
            // Account exists but unverified — resend a fresh OTP
            sendFreshOtp(email);
            return OtpSentResponse.builder()
                    .email(email)
                    .message("A new verification code has been sent to your email.")
                    .build();
        }

        String studentId = req.getStudentId();
        if (studentId != null && !studentId.isBlank() && userRepository.existsByStudentId(studentId.trim())) {
            throw new ConflictException("This student ID is already registered");
        }

        String deptCode = (req.getDepartmentCode() == null || req.getDepartmentCode().isBlank())
                ? "CSE" : req.getDepartmentCode();
        var dept = departmentRepository.findByCode(deptCode)
                .orElseThrow(() -> new BadRequestException("Unknown department: " + deptCode));

        var user = User.builder()
                .name(req.getName().trim())
                .studentId(studentId != null ? studentId.trim() : null)
                .email(email)
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(User.Role.STUDENT)
                .department(dept)
                .gender(req.getGender())
                .semesterNumber(req.getSemesterNumber())
                .emailVerified(false)
                .build();

        userRepository.save(user);
        sendFreshOtp(email);

        return OtpSentResponse.builder()
                .email(email)
                .message("Verification code sent to your email. It expires in 10 minutes.")
                .build();
    }

    @Transactional
    public AuthResponse verifyEmail(OtpVerifyRequest req) {
        String email = req.getEmail().toLowerCase().trim();

        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("No account found with this email"));

        if (user.isEmailVerified()) {
            return buildAuthResponse(user);
        }

        var otpToken = otpTokenRepository.findLatestUnusedByEmail(email)
                .orElseThrow(() -> new BadRequestException("No verification code found. Please request a new one."));

        if (otpToken.isExpired()) {
            throw new BadRequestException("Verification code has expired. Please request a new one.");
        }
        if (!otpToken.getOtpCode().equals(req.getOtp())) {
            throw new BadRequestException("Incorrect verification code.");
        }

        otpToken.setUsed(true);
        otpTokenRepository.save(otpToken);

        user.setEmailVerified(true);
        userRepository.save(user);

        otpTokenRepository.deleteAllByEmail(email);

        return buildAuthResponse(user);
    }

    @Transactional
    public OtpSentResponse resendOtp(String email) {
        email = email.toLowerCase().trim();

        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("No account found with this email"));

        if (user.isEmailVerified()) {
            throw new BadRequestException("This account is already verified.");
        }

        sendFreshOtp(email);

        return OtpSentResponse.builder()
                .email(email)
                .message("A new verification code has been sent to your email.")
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        String email = req.getEmail().toLowerCase().trim();

        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("No account found with this email"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Incorrect password");
        }
        if (!user.isEmailVerified()) {
            throw new BadRequestException("EMAIL_NOT_VERIFIED:" + email);
        }

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refresh(String refreshTokenValue) {
        var rt = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));

        if (rt.isExpired()) {
            refreshTokenRepository.delete(rt);
            throw new BadRequestException("Refresh token has expired. Please log in again.");
        }

        var user = rt.getUser();
        refreshTokenRepository.delete(rt);
        return buildAuthResponse(user);
    }

    @Transactional
    public void logout(String refreshTokenValue) {
        refreshTokenRepository.findByToken(refreshTokenValue)
                .ifPresent(refreshTokenRepository::delete);
    }
    private void sendFreshOtp(String email) {
        otpTokenRepository.deleteAllByEmail(email);
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        var token = OtpToken.builder()
                .email(email)
                .otpCode(code)
                .expiresAt(Instant.now().plusSeconds(600))
                .build();
        otpTokenRepository.save(token);
        emailService.sendOtp(email, code);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name());

        String refreshValue = jwtTokenProvider.generateRefreshTokenValue();
        var rt = RefreshToken.builder()
                .user(user)
                .token(refreshValue)
                .expiresAt(Instant.now().plusMillis(jwtTokenProvider.getRefreshExpirationMs()))
                .build();
        refreshTokenRepository.save(rt);

        AuthResponse.DeptSummary deptSummary = user.getDepartment() != null
                ? AuthResponse.DeptSummary.builder()
                        .code(user.getDepartment().getCode())
                        .name(user.getDepartment().getName())
                        .build()
                : null;

        var userSummary = AuthResponse.UserSummary.builder()
                .id(user.getId())
                .studentId(user.getStudentId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .department(deptSummary)
                .gender(user.getGender() != null ? user.getGender().name() : null)
                .semesterNumber(user.getSemesterNumber())
                .profilePicUrl(user.getProfilePicUrl())
                .build();

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshValue)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getRefreshExpirationMs() / 1000)
                .user(userSummary)
                .build();
    }
}
