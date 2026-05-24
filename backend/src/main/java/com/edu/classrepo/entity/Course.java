package com.edu.classrepo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "courses", indexes = {
    @Index(name = "idx_courses_code", columnList = "code"),
    @Index(name = "idx_courses_department", columnList = "department_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(nullable = false, length = 250)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(name = "credit_hours")
    @Builder.Default
    private Double creditHours = 3.0;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "course_faculty",
        joinColumns = @JoinColumn(name = "course_id"),
        inverseJoinColumns = @JoinColumn(name = "faculty_id")
    )
    @Builder.Default
    private Set<Faculty> faculty = new HashSet<>();
}
