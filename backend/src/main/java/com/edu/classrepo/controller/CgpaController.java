package com.edu.classrepo.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cgpa")
public class CgpaController {

    /**
     * EDU Grading Scale (East Delta University).
     * Source: eastdelta.edu.bd/about-us/grading-system
     * Honors: Summa 3.90+, Magna 3.75–3.89, Cum Laude 3.50–3.74
     * Probation: CGPA < 2.0
     * C- or better required for CR credit.
     */
    private static final Map<String, Double> GRADE_POINTS = Map.ofEntries(
            Map.entry("A+",  4.00),
            Map.entry("A",   3.75),
            Map.entry("A-",  3.50),
            Map.entry("B+",  3.25),
            Map.entry("B",   3.00),
            Map.entry("B-",  2.75),
            Map.entry("C+",  2.50),
            Map.entry("C",   2.25),
            Map.entry("C-",  2.00),
            Map.entry("D+",  1.75),
            Map.entry("D",   1.50),
            Map.entry("F",   0.00)
    );

    @GetMapping("/scale")
    public ResponseEntity<Map<String, Double>> getScale() {
        return ResponseEntity.ok(GRADE_POINTS);
    }

    @PostMapping("/calculate")
    public ResponseEntity<Map<String, Object>> calculate(@Valid @RequestBody CalculateRequest req) {
        double totalPoints = 0;
        double totalCredits = 0;

        for (CourseGrade cg : req.getCourses()) {
            Double gp = GRADE_POINTS.get(cg.getGrade().toUpperCase().trim());
            if (gp == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Unknown grade: " + cg.getGrade()));
            }
            if (!cg.getGrade().equalsIgnoreCase("F")) {
                // F does not contribute credits earned, but IS counted in GPA calc
            }
            totalPoints += gp * cg.getCredits();
            totalCredits += cg.getCredits();
        }

        double cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0.0;
        double rounded = BigDecimal.valueOf(cgpa).setScale(2, RoundingMode.HALF_UP).doubleValue();

        String standing = standing(rounded);

        return ResponseEntity.ok(Map.of(
                "cgpa", rounded,
                "totalCredits", totalCredits,
                "standing", standing
        ));
    }

    private String standing(double cgpa) {
        if (cgpa >= 3.90) return "Summa Cum Laude";
        if (cgpa >= 3.75) return "Magna Cum Laude";
        if (cgpa >= 3.50) return "Cum Laude";
        if (cgpa >= 3.00) return "Good Standing";
        if (cgpa >= 2.00) return "Satisfactory";
        return "Academic Probation";
    }

    @Data
    public static class CalculateRequest {
        @NotNull
        private List<CourseGrade> courses;
    }

    @Data
    public static class CourseGrade {
        private String courseCode;

        @NotBlank
        private String grade;

        @Min(1) @Max(6)
        private double credits;
    }
}
