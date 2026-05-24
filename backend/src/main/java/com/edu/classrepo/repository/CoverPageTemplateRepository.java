package com.edu.classrepo.repository;

import com.edu.classrepo.entity.CoverPageTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CoverPageTemplateRepository extends JpaRepository<CoverPageTemplate, UUID> {
    List<CoverPageTemplate> findByActiveTrue();
    List<CoverPageTemplate> findByTypeAndActiveTrue(CoverPageTemplate.Type type);
}
