package com.edu.classrepo.controller;

import com.edu.classrepo.entity.RoutineSlot;
import com.edu.classrepo.entity.Semester;
import com.edu.classrepo.exception.ResourceNotFoundException;
import com.edu.classrepo.repository.RoutineSlotRepository;
import com.edu.classrepo.repository.SemesterRepository;
import com.edu.classrepo.service.RoutineIngestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/semesters")
@RequiredArgsConstructor
public class SemesterController {

    private final SemesterRepository semesterRepository;
    private final RoutineSlotRepository routineSlotRepository;
    private final RoutineIngestionService ingestionService;

    @GetMapping
    public ResponseEntity<List<Semester>> getAll() {
        return ResponseEntity.ok(semesterRepository.findAll());
    }

    @GetMapping("/active")
    public ResponseEntity<Semester> getActive() {
        return ResponseEntity.ok(
            semesterRepository.findByActiveTrue()
                .orElseThrow(() -> new ResourceNotFoundException("No active semester found"))
        );
    }

    @PostMapping("/ingest")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> ingest(
            @RequestParam("file") MultipartFile file,
            @RequestParam("semesterCode") String semesterCode,
            @RequestParam("semesterName") String semesterName,
            @RequestParam(value = "setActive", defaultValue = "false") boolean setActive
    ) throws IOException {
        if (!file.getOriginalFilename().endsWith(".docx")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Only .docx files are accepted"));
        }

        Semester semester = ingestionService.ingest(file, semesterCode, semesterName, setActive);
        long slotCount = routineSlotRepository.findBySemesterId(semester.getId()).size();

        return ResponseEntity.ok(Map.of(
                "message", "Semester ingested successfully",
                "semesterCode", semester.getCode(),
                "slotsCreated", slotCount,
                "active", semester.isActive()
        ));
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Semester> activate(@PathVariable UUID id) {
        var semester = semesterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Semester", id));
        semesterRepository.deactivateAll();
        semester.setActive(true);
        return ResponseEntity.ok(semesterRepository.save(semester));
    }
}
