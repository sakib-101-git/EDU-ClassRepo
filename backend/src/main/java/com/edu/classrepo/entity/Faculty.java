package com.edu.classrepo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "faculty", indexes = {
    @Index(name = "idx_faculty_short_form", columnList = "short_form")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Faculty {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "short_form", nullable = false, unique = true, length = 30)
    private String shortForm;

    @Column(nullable = false, length = 150)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(length = 150)
    private String email;
}
