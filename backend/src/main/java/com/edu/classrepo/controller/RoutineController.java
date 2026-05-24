package com.edu.classrepo.controller;

import com.edu.classrepo.entity.*;
import com.edu.classrepo.exception.BadRequestException;
import com.edu.classrepo.exception.ResourceNotFoundException;
import com.edu.classrepo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/routine")
@RequiredArgsConstructor
public class RoutineController {

    private final SemesterRepository semesterRepository;
    private final RoutineSlotRepository routineSlotRepository;
    private final CustomRoutineRepository customRoutineRepository;
    private final UserRepository userRepository;

    /** Returns all slots for a semester as a flat list ordered by day and time. */
    @GetMapping
    public ResponseEntity<List<RoutineSlot>> getRoutine(
            @RequestParam(required = false) UUID semesterId
    ) {
        Semester semester;
        if (semesterId != null) {
            semester = semesterRepository.findById(semesterId)
                    .orElseThrow(() -> new ResourceNotFoundException("Semester", semesterId));
        } else {
            semester = semesterRepository.findByActiveTrue()
                    .orElseThrow(() -> new BadRequestException("No active semester configured"));
        }

        List<RoutineSlot> slots = routineSlotRepository.findBySemesterIdWithDetails(semester.getId());
        return ResponseEntity.ok(slots);
    }

    /** Save/update a student's custom routine for the active semester. */
    @PostMapping("/custom")
    public ResponseEntity<CustomRoutine> saveCustomRoutine(
            @AuthenticationPrincipal UUID userId,
            @RequestBody Map<String, Object> body
    ) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        var semester = semesterRepository.findByActiveTrue()
                .orElseThrow(() -> new ResourceNotFoundException("No active semester"));

        @SuppressWarnings("unchecked")
        List<String> slotIds = (List<String>) body.get("slotIds");
        String name = (String) body.getOrDefault("name", "My Routine");

        if (slotIds == null || slotIds.isEmpty()) {
            throw new BadRequestException("slotIds must not be empty");
        }

        // Fetch and validate slots (must belong to active semester)
        Set<RoutineSlot> slots = new HashSet<>();
        for (String idStr : slotIds) {
            UUID slotId = UUID.fromString(idStr);
            var slot = routineSlotRepository.findById(slotId)
                    .orElseThrow(() -> new ResourceNotFoundException("RoutineSlot", slotId));
            if (!slot.getSemester().getId().equals(semester.getId())) {
                throw new BadRequestException("Slot " + idStr + " does not belong to the active semester");
            }
            slots.add(slot);
        }

        // Upsert: one custom routine per student per semester
        var existing = customRoutineRepository.findByStudentId(userId).stream()
                .filter(r -> r.getSemester().getId().equals(semester.getId()))
                .findFirst();

        CustomRoutine routine = existing.orElseGet(() ->
                CustomRoutine.builder().student(user).semester(semester).build());
        routine.setName(name);
        routine.setSlots(slots);

        return ResponseEntity.ok(customRoutineRepository.save(routine));
    }

    /** Returns the logged-in student's custom routine for the active semester. */
    @GetMapping("/custom/mine")
    public ResponseEntity<List<CustomRoutine>> getMyCustomRoutines(
            @AuthenticationPrincipal UUID userId
    ) {
        return ResponseEntity.ok(customRoutineRepository.findByStudentId(userId));
    }
}
