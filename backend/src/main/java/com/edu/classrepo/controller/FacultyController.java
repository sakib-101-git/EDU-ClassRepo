package com.edu.classrepo.controller;

import com.edu.classrepo.entity.Faculty;
import com.edu.classrepo.exception.ResourceNotFoundException;
import com.edu.classrepo.repository.FacultyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/faculty")
@RequiredArgsConstructor
public class FacultyController {

    private final FacultyRepository facultyRepository;

    @GetMapping
    public ResponseEntity<List<Faculty>> getAll(
            @RequestParam(required = false) String dept
    ) {
        List<Faculty> result = dept != null
                ? facultyRepository.findByDepartmentCode(dept)
                : facultyRepository.findAll();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Faculty> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(
            facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty", id))
        );
    }
}
