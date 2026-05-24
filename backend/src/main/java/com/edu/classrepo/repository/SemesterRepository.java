package com.edu.classrepo.repository;

import com.edu.classrepo.entity.Semester;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SemesterRepository extends JpaRepository<Semester, UUID> {
    Optional<Semester> findByCode(String code);
    Optional<Semester> findByActiveTrue();

    @Modifying
    @Query("UPDATE Semester s SET s.active = false WHERE s.active = true")
    void deactivateAll();
}
