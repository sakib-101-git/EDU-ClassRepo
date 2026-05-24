package com.edu.classrepo.repository;

import com.edu.classrepo.entity.Material;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MaterialRepository extends JpaRepository<Material, UUID> {
    Page<Material> findByCourseId(UUID courseId, Pageable pageable);
    Page<Material> findByCourseIdAndStatus(UUID courseId, Material.Status status, Pageable pageable);
    Page<Material> findByCourseIdAndFacultyIdAndStatus(UUID courseId, UUID facultyId, Material.Status status, Pageable pageable);
    Page<Material> findByStatus(Material.Status status, Pageable pageable);
    long countByCourseIdAndStatus(UUID courseId, Material.Status status);
}
