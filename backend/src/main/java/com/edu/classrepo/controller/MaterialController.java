package com.edu.classrepo.controller;

import com.edu.classrepo.entity.Material;
import com.edu.classrepo.exception.BadRequestException;
import com.edu.classrepo.exception.ResourceNotFoundException;
import com.edu.classrepo.repository.*;
import com.edu.classrepo.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/materials")
@RequiredArgsConstructor
public class MaterialController {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "image/jpeg", "image/png", "image/gif"
    );
    private static final long MAX_SIZE = 50L * 1024 * 1024; // 50MB

    private final MaterialRepository materialRepository;
    private final CourseRepository courseRepository;
    private final FacultyRepository facultyRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    @GetMapping("/course/{courseId}")
    public ResponseEntity<Page<Material>> getByCourse(
            @PathVariable UUID courseId,
            @RequestParam(required = false) UUID facultyId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        boolean isAdmin = isAdmin();

        Page<Material> page;
        if (facultyId != null) {
            page = materialRepository.findByCourseIdAndFacultyIdAndStatus(courseId, facultyId,
                      Material.Status.APPROVED, pageable);
        } else if (isAdmin) {
            page = materialRepository.findByCourseId(courseId, pageable);
        } else {
            page = materialRepository.findByCourseIdAndStatus(courseId, Material.Status.APPROVED, pageable);
        }

        return ResponseEntity.ok(page);
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<Material>> getPending(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(
            materialRepository.findByStatus(Material.Status.PENDING, pageable)
        );
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("courseId") UUID courseId,
            @RequestParam(value = "facultyId", required = false) UUID facultyId,
            @RequestParam(value = "facultyName", required = false) String facultyName,
            @RequestParam(value = "facultyShortForm", required = false) String facultyShortForm,
            @AuthenticationPrincipal UUID userId
    ) throws IOException {
        if (file.isEmpty()) throw new BadRequestException("File is empty");
        if (file.getSize() > MAX_SIZE) throw new BadRequestException("File exceeds 50MB limit");
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("File type not allowed: " + file.getContentType());
        }

        var course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));
        var uploader = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        com.edu.classrepo.entity.Faculty faculty = null;
        if (facultyId != null) {
            faculty = facultyRepository.findById(facultyId).orElse(null);
        } else if (facultyShortForm != null && !facultyShortForm.isBlank()) {
            String shortForm = facultyShortForm.trim().toUpperCase();
            if (facultyName == null || facultyName.isBlank())
                throw new BadRequestException("Faculty full name is required when adding a new faculty member");
            String fullName = facultyName.trim();
            faculty = facultyRepository.findByShortFormIgnoreCase(shortForm)
                    .orElseGet(() -> facultyRepository.save(
                            com.edu.classrepo.entity.Faculty.builder()
                                    .shortForm(shortForm)
                                    .name(fullName)
                                    .department(course.getDepartment())
                                    .build()));
        }

        String url = storageService.uploadMaterial(file, courseId, userId);

        Material.Status status = isAdmin() ? Material.Status.APPROVED : Material.Status.PENDING;

        var material = Material.builder()
                .course(course)
                .faculty(faculty)
                .uploader(uploader)
                .fileName(file.getOriginalFilename())
                .fileUrl(url)
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .status(status)
                .build();

        materialRepository.save(material);

        return ResponseEntity.ok(Map.of(
                "message", status == Material.Status.APPROVED ? "Uploaded" : "Uploaded — pending approval",
                "status", status
        ));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> approve(@PathVariable UUID id) {
        var m = materialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material", id));
        m.setStatus(Material.Status.APPROVED);
        materialRepository.save(m);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> reject(@PathVariable UUID id) {
        var m = materialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material", id));
        storageService.delete(m.getFileUrl());
        materialRepository.delete(m);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/rename")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> rename(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        String newName = body.get("fileName");
        if (newName == null || newName.isBlank()) throw new BadRequestException("fileName is required");

        var m = materialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material", id));
        m.setFileName(newName.trim());
        materialRepository.save(m);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal UUID userId) {
        var m = materialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Material", id));

        if (!isAdmin() && !m.getUploader().getId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("Not authorized");
        }

        storageService.delete(m.getFileUrl());
        materialRepository.delete(m);
        return ResponseEntity.noContent().build();
    }

    private boolean isAdmin() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }
}
