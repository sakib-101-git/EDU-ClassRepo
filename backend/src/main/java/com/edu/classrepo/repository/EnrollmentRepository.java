package com.edu.classrepo.repository;

import com.edu.classrepo.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {
    boolean existsByUserIdAndCourseId(UUID userId, UUID courseId);
    Optional<Enrollment> findByUserIdAndCourseId(UUID userId, UUID courseId);

    @Query("SELECT e FROM Enrollment e JOIN FETCH e.course c JOIN FETCH c.department WHERE e.user.id = :userId")
    List<Enrollment> findByUserIdWithCourse(@Param("userId") UUID userId);
}
