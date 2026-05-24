package com.edu.classrepo.repository;

import com.edu.classrepo.entity.CustomRoutine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomRoutineRepository extends JpaRepository<CustomRoutine, UUID> {
    List<CustomRoutine> findByStudentId(UUID studentId);

    @Query("""
        SELECT cr FROM CustomRoutine cr
        JOIN FETCH cr.semester
        LEFT JOIN FETCH cr.slots
        WHERE cr.id = :id AND cr.student.id = :studentId
        """)
    Optional<CustomRoutine> findByIdAndStudentId(@Param("id") UUID id, @Param("studentId") UUID studentId);
}
