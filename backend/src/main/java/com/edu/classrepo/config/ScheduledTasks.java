package com.edu.classrepo.config;

import com.edu.classrepo.repository.OtpTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledTasks {

    private final OtpTokenRepository otpTokenRepository;

    // Runs every 6 hours — deletes OTP tokens that expired more than 1 hour ago
    @Scheduled(fixedRateString = "PT6H")
    @Transactional
    public void cleanExpiredOtpTokens() {
        Instant cutoff = Instant.now().minusSeconds(3600);
        otpTokenRepository.deleteAllExpiredBefore(cutoff);
        log.debug("Cleaned up expired OTP tokens");
    }
}
