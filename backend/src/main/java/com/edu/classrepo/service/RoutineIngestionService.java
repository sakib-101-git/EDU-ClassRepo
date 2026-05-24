package com.edu.classrepo.service;

import com.edu.classrepo.entity.*;
import com.edu.classrepo.exception.RoutineParseException;
import com.edu.classrepo.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Parses EDU's semester routine .docx file and upserts semester data.
 *
 * Expected .docx format:
 *   - Document title: "... Routine ... – <SEMESTER_NAME>"
 *   - Sections per day (Saturday, Sunday, Monday, Tuesday, Wednesday, Thursday)
 *   - Each day has two sub-tables:
 *       Theory Classes: headers 8.30-10.00 | 10.00-11.30 | 11.30-1.00 | 1.30-3.00 | 3.00-4.30 | 4.30-6.00
 *       Lab Classes:    headers 9.30-11.30 | 11.30-1.30 | 1.30-3.30 | 3.30-5.30 (or similar 2h slots)
 *   - Each data row: Room | [COURSE.SECTION FACULTY] | ...
 *   - Cell format: "CSE 211.4 TAS"  or  "CSE 215.1 (11.30-1.30) PH"  (time override allowed)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RoutineIngestionService {

    private static final Pattern CELL_PATTERN =
            Pattern.compile("([A-Z]+\\s+\\d+(?:\\.\\d+)?)\\.(\\d+)(?:\\s+\\(([\\d.\\-]+)\\))?\\s+([A-Z][\\w.]+)");

    private static final Map<String, RoutineSlot.DayOfWeek> DAY_MAP = Map.of(
            "saturday",  RoutineSlot.DayOfWeek.SATURDAY,
            "sunday",    RoutineSlot.DayOfWeek.SUNDAY,
            "monday",    RoutineSlot.DayOfWeek.MONDAY,
            "tuesday",   RoutineSlot.DayOfWeek.TUESDAY,
            "wednesday", RoutineSlot.DayOfWeek.WEDNESDAY,
            "thursday",  RoutineSlot.DayOfWeek.THURSDAY
    );

    private final SemesterRepository semesterRepository;
    private final RoutineSlotRepository routineSlotRepository;
    private final CourseRepository courseRepository;
    private final FacultyRepository facultyRepository;

    @Transactional
    public Semester ingest(MultipartFile file, String semesterCode, String semesterName,
                           boolean setActive) throws IOException {
        List<String> errors = new ArrayList<>();
        List<RoutineSlot> parsedSlots = new ArrayList<>();

        try (XWPFDocument doc = new XWPFDocument(file.getInputStream())) {
            parseDocument(doc, semesterCode, parsedSlots, errors);
        }

        if (!errors.isEmpty()) {
            throw new RoutineParseException(errors);
        }

        // Upsert semester
        Semester semester = semesterRepository.findByCode(semesterCode)
                .orElseGet(() -> Semester.builder()
                        .code(semesterCode)
                        .name(semesterName)
                        .build());
        semester.setName(semesterName);

        if (setActive) {
            semesterRepository.deactivateAll();
            semester.setActive(true);
        }
        semesterRepository.save(semester);

        // Delete old slots for this semester (idempotent re-upload)
        routineSlotRepository.deleteBySemesterId(semester.getId());

        // Attach semester and save
        for (RoutineSlot slot : parsedSlots) {
            slot.setSemester(semester);
        }
        routineSlotRepository.saveAll(parsedSlots);

        log.info("Ingested {} slots for semester {}", parsedSlots.size(), semesterCode);
        return semester;
    }

    private void parseDocument(XWPFDocument doc, String semesterCode,
                                List<RoutineSlot> slots, List<String> errors) {
        List<IBodyElement> elements = doc.getBodyElements();
        RoutineSlot.DayOfWeek currentDay = null;
        RoutineSlot.ClassType currentType = RoutineSlot.ClassType.THEORY;
        List<LocalTime[]> timeHeaders = new ArrayList<>();

        log.info("Document has {} top-level elements", elements.size());

        for (IBodyElement el : elements) {
            if (el instanceof XWPFParagraph para) {
                String text = para.getText().trim();
                if (!text.isBlank()) log.info("PARA: \"{}\"", text);
                String lower = text.toLowerCase();

                // Detect day
                for (Map.Entry<String, RoutineSlot.DayOfWeek> entry : DAY_MAP.entrySet()) {
                    if (lower.startsWith(entry.getKey())) {
                        currentDay = entry.getValue();
                        timeHeaders.clear();
                        log.info("  → Day set to {}", currentDay);
                        break;
                    }
                }
                // Detect class type
                if (lower.contains("theory classes")) {
                    currentType = RoutineSlot.ClassType.THEORY;
                    timeHeaders.clear();
                    log.info("  → Type set to THEORY");
                } else if (lower.contains("lab classes")) {
                    currentType = RoutineSlot.ClassType.LAB;
                    timeHeaders.clear();
                    log.info("  → Type set to LAB");
                }

            } else if (el instanceof XWPFTable table) {
                log.info("TABLE: {} rows, currentDay={}", table.getRows().size(), currentDay);
                if (table.getRows().size() > 0) {
                    XWPFTableRow r0 = table.getRows().get(0);
                    List<String> headers = r0.getTableCells().stream().map(c -> c.getText().trim()).toList();
                    log.info("  Header row: {}", headers);
                    if (table.getRows().size() > 1) {
                        XWPFTableRow r1 = table.getRows().get(1);
                        List<String> row1 = r1.getTableCells().stream().map(c -> c.getText().trim()).toList();
                        log.info("  Row 1: {}", row1);
                    }
                }
            }
            if (el instanceof XWPFTable table && currentDay != null) {
                List<XWPFTableRow> rows = table.getRows();
                if (rows.isEmpty()) continue;

                // First row = headers (time slots or room header)
                XWPFTableRow headerRow = rows.get(0);
                timeHeaders = parseTimeHeaders(headerRow);

                if (timeHeaders.isEmpty()) continue;

                // Subsequent rows = room data
                for (int r = 1; r < rows.size(); r++) {
                    XWPFTableRow row = rows.get(r);
                    List<XWPFTableCell> cells = row.getTableCells();
                    if (cells.isEmpty()) continue;

                    String room = cells.get(0).getText().trim();

                    for (int c = 1; c < cells.size() && c - 1 < timeHeaders.size(); c++) {
                        String cellText = cells.get(c).getText().trim();
                        if (cellText.isBlank()) continue;

                        LocalTime[] times = timeHeaders.get(c - 1);
                        parseCell(cellText, currentDay, currentType, times[0], times[1],
                                  room, semesterCode + ":row" + r + ":col" + c, slots, errors);
                    }
                }
            }
        }
    }

    private List<LocalTime[]> parseTimeHeaders(XWPFTableRow row) {
        List<LocalTime[]> result = new ArrayList<>();
        List<XWPFTableCell> cells = row.getTableCells();

        for (int i = 1; i < cells.size(); i++) {
            String text = cells.get(i).getText().trim();
            LocalTime[] times = parseTimeRange(text);
            if (times != null) result.add(times);
        }
        return result;
    }

    private LocalTime[] parseTimeRange(String text) {
        // Handles formats: "8.30-10.00" or "8:30-10:00"
        String normalized = text.replace('.', ':');
        String[] parts = normalized.split("-");
        if (parts.length != 2) return null;
        try {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("H:mm");
            return new LocalTime[]{
                LocalTime.parse(parts[0].trim(), fmt),
                LocalTime.parse(parts[1].trim(), fmt)
            };
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private void parseCell(String text, RoutineSlot.DayOfWeek day, RoutineSlot.ClassType type,
                            LocalTime defaultStart, LocalTime defaultEnd, String room,
                            String location, List<RoutineSlot> slots, List<String> errors) {
        // A cell can contain multiple entries (line-separated in some docs)
        String[] lines = text.split("\\n");
        for (String line : lines) {
            line = line.trim();
            if (line.isBlank()) continue;

            Matcher m = CELL_PATTERN.matcher(line);
            if (!m.find()) {
                // Not a course entry — skip silently (could be room/dept label)
                continue;
            }

            String courseCode = m.group(1).trim().toUpperCase();
            String section = m.group(2);
            String timeOverride = m.group(3);
            String facultyShort = m.group(4).trim();

            LocalTime start = defaultStart;
            LocalTime end = defaultEnd;

            if (timeOverride != null) {
                LocalTime[] overrideTimes = parseTimeRange(timeOverride);
                if (overrideTimes != null) {
                    start = overrideTimes[0];
                    end = overrideTimes[1];
                }
            }

            Optional<Course> courseOpt = courseRepository.findByCode(courseCode);
            if (courseOpt.isEmpty()) {
                errors.add("[%s] Unknown course code: %s".formatted(location, courseCode));
                continue;
            }

            Faculty faculty = null;
            if (!facultyShort.equalsIgnoreCase("TBA")) {
                // Try exact then case-insensitive match
                Optional<Faculty> facultyOpt = facultyRepository.findByShortFormIgnoreCase(facultyShort);
                if (facultyOpt.isEmpty()) {
                    errors.add("[%s] Unknown faculty short form: %s".formatted(location, facultyShort));
                    continue;
                }
                faculty = facultyOpt.get();
            }

            slots.add(RoutineSlot.builder()
                    .course(courseOpt.get())
                    .faculty(faculty)
                    .section(section)
                    .dayOfWeek(day)
                    .startTime(start)
                    .endTime(end)
                    .room(room)
                    .classType(type)
                    .build());
        }
    }
}
