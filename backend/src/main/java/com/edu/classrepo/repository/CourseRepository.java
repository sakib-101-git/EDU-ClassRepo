package com.edu.classrepo.repository;

import com.edu.classrepo.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {
    Optional<Course> findByCode(String code);
    boolean existsByCode(String code);

    Page<Course> findByDepartmentCode(String deptCode, Pageable pageable);

    @Query("""
        SELECT c FROM Course c
        WHERE LOWER(c.code) LIKE LOWER(CONCAT('%', :search, '%'))
           OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%'))
        """)
    Page<Course> searchByText(@Param("search") String search, Pageable pageable);

    @Query("""
        SELECT c FROM Course c
        WHERE c.department.code = :deptCode
          AND (LOWER(c.code) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')))
        """)
    Page<Course> searchByDeptAndText(
        @Param("deptCode") String deptCode,
        @Param("search") String search,
        Pageable pageable
    );
}
