package com.edu.classrepo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "routine_slots", indexes = {
    @Index(name = "idx_slot_semester", columnList = "semester_id"),
    @Index(name = "idx_slot_course", columnList = "course_id"),
    @Index(name = "idx_slot_faculty", columnList = "faculty_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RoutineSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id")
    private Faculty faculty;

    @Column(nullable = false, length = 10)
    private String section;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 15)
    private DayOfWeek dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(length = 20)
    private String room;

    @Enumerated(EnumType.STRING)
    @Column(name = "class_type", nullable = false, length = 10)
    @Builder.Default
    private ClassType classType = ClassType.THEORY;

    public enum DayOfWeek { SATURDAY, SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY }
    public enum ClassType { THEORY, LAB }
}
