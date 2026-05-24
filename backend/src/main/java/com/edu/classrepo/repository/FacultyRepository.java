package com.edu.classrepo.repository;

import com.edu.classrepo.entity.Faculty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FacultyRepository extends JpaRepository<Faculty, UUID> {
    Optional<Faculty> findByShortForm(String shortForm);
    Optional<Faculty> findByShortFormIgnoreCase(String shortForm);
    boolean existsByShortForm(String shortForm);
    List<Faculty> findByDepartmentCode(String deptCode);
}
