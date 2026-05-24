package com.edu.classrepo.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "custom_routines", indexes = {
    @Index(name = "idx_custom_routine_student", columnList = "student_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CustomRoutine {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    @Column(nullable = false, length = 100)
    @Builder.Default
    private String name = "My Routine";

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "custom_routine_slots",
        joinColumns = @JoinColumn(name = "routine_id"),
        inverseJoinColumns = @JoinColumn(name = "slot_id")
    )
    @Builder.Default
    private Set<RoutineSlot> slots = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
