package com.edu.classrepo.controller;

import com.edu.classrepo.entity.Course;
import com.edu.classrepo.exception.ConflictException;
import com.edu.classrepo.exception.ResourceNotFoundException;
import com.edu.classrepo.repository.CourseRepository;
import com.edu.classrepo.repository.DepartmentRepository;
import com.edu.classrepo.repository.EnrollmentRepository;
import com.edu.classrepo.repository.MaterialRepository;
import com.edu.classrepo.entity.Enrollment;
import com.edu.classrepo.entity.Material;
import com.edu.classrepo.entity.User;
import com.edu.classrepo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseRepository courseRepository;
    private final DepartmentRepository departmentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final MaterialRepository materialRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Page<Course>> search(
            @RequestParam(required = false) String dept,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "code") Pageable pageable
    ) {
        boolean hasDept   = dept   != null && !dept.isBlank();
        boolean hasSearch = search != null && !search.isBlank();

        Page<Course> result;
        if (hasDept && hasSearch) {
            result = courseRepository.searchByDeptAndText(dept, search, pageable);
        } else if (hasSearch) {
            result = courseRepository.searchByText(search, pageable);
        } else if (hasDept) {
            result = courseRepository.findByDepartmentCode(dept, pageable);
        } else {
            result = courseRepository.findAll(pageable);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(
            courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", id))
        );
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Course> create(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        if (courseRepository.existsByCode(code)) {
            throw new ConflictException("Course code already exists: " + code);
        }
        var dept = departmentRepository.findByCode(body.get("departmentCode"))
                .orElseThrow(() -> new ResourceNotFoundException("Department", body.get("departmentCode")));

        var course = Course.builder()
                .code(code.toUpperCase())
                .title(body.get("title"))
                .department(dept)
                .build();

        return ResponseEntity.ok(courseRepository.save(course));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        courseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Course", id));
        courseRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // --- Enrollment sub-resource ---

    @PostMapping("/{id}/enroll")
    public ResponseEntity<Map<String, String>> enroll(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId
    ) {
        if (enrollmentRepository.existsByUserIdAndCourseId(userId, id)) {
            throw new ConflictException("Already enrolled in this course");
        }
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        var course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", id));

        enrollmentRepository.save(Enrollment.builder().user(user).course(course).build());
        return ResponseEntity.ok(Map.of("message", "Enrolled successfully"));
    }

    @DeleteMapping("/{id}/enroll")
    public ResponseEntity<Void> unenroll(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId
    ) {
        enrollmentRepository.findByUserIdAndCourseId(userId, id)
                .ifPresent(enrollmentRepository::delete);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/enrolled")
    public ResponseEntity<List<Course>> myEnrollments(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(
            enrollmentRepository.findByUserIdWithCourse(userId)
                .stream()
                .map(Enrollment::getCourse)
                .toList()
        );
    }
}
