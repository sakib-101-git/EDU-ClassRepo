package com.edu.classrepo.repository;

import com.edu.classrepo.entity.RoutineSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RoutineSlotRepository extends JpaRepository<RoutineSlot, UUID> {
    List<RoutineSlot> findBySemesterId(UUID semesterId);

    @Query("""
        SELECT rs FROM RoutineSlot rs
        JOIN FETCH rs.course c
        JOIN FETCH c.department
        LEFT JOIN FETCH rs.faculty f
        WHERE rs.semester.id = :semesterId
        ORDER BY rs.dayOfWeek, rs.startTime
        """)
    List<RoutineSlot> findBySemesterIdWithDetails(@Param("semesterId") UUID semesterId);

    @Modifying
    @Query("DELETE FROM RoutineSlot rs WHERE rs.semester.id = :semesterId")
    void deleteBySemesterId(@Param("semesterId") UUID semesterId);
}
