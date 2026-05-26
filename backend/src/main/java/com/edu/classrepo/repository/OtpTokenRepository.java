package com.edu.classrepo.repository;

import com.edu.classrepo.entity.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface OtpTokenRepository extends JpaRepository<OtpToken, UUID> {

    @Query("SELECT o FROM OtpToken o WHERE o.email = :email AND o.used = false ORDER BY o.createdAt DESC LIMIT 1")
    Optional<OtpToken> findLatestUnusedByEmail(String email);

    @Modifying
    @Query("DELETE FROM OtpToken o WHERE o.email = :email")
    void deleteAllByEmail(String email);

    @Modifying
    @Query("DELETE FROM OtpToken o WHERE o.expiresAt < :cutoff")
    void deleteAllExpiredBefore(Instant cutoff);
}
