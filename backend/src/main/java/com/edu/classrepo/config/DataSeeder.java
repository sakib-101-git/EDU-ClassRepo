package com.edu.classrepo.config;

import com.edu.classrepo.entity.Department;
import com.edu.classrepo.entity.User;
import com.edu.classrepo.repository.DepartmentRepository;
import com.edu.classrepo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Seeds (and keeps current) EDU departments, faculty, and courses on every startup.
 * Faculty and courses use UPSERT so titles, credits, and names stay accurate.
 * Obsolete departments (BBA, ECO) are removed along with all their data.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements ApplicationRunner {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbc;
    private final Environment springEnv;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        removeObsoleteDepartments();
        fixLegacyData();
        seedDepartments();
        upsertFaculty();
        upsertCourses();
        seedAdminAccounts();
        log.info("DataSeeder complete.");
    }

    // ── Remove BBA and ECO from DB ────────────────────────────────────────────

    private void removeObsoleteDepartments() {
        for (String code : List.of("BBA", "ECO")) {
            Integer count = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM departments WHERE code = ?", Integer.class, code);
            if (count != null && count > 0) {
                jdbc.update("DELETE FROM courses WHERE department_id=(SELECT id FROM departments WHERE code=?)", code);
                jdbc.update("DELETE FROM faculty WHERE department_id=(SELECT id FROM departments WHERE code=?)", code);
                jdbc.update("DELETE FROM departments WHERE code=?", code);
                log.info("Removed obsolete department: {}", code);
            }
        }
    }

    // ── Fix incorrect data left by earlier seeder versions ────────────────────

    private void fixLegacyData() {
        // ANB was incorrectly named "Arfan Ahmed (ANB)"; correct is Ms. Anika Bushra
        jdbc.update("UPDATE faculty SET name='Ms. Anika Bushra' WHERE short_form='ANB' AND name LIKE '%Arfan%'");
        // Normalise MUSFEQUA → MUSFEQA to match the official routine
        jdbc.update("UPDATE faculty SET short_form='MUSFEQA' WHERE short_form='MUSFEQUA'");
        // AAA teaches EEE courses — move to EEE dept
        jdbc.update("UPDATE faculty SET department_id=(SELECT id FROM departments WHERE code='EEE') WHERE short_form='AAA'");
    }

    // ── Departments ───────────────────────────────────────────────────────────

    private void seedDepartments() {
        List<String[]> depts = List.of(
            new String[]{"CSE", "Computer Science & Engineering"},
            new String[]{"EEE", "Electrical & Electronic Engineering"},
            new String[]{"ETE", "Electronics & Telecommunication Engineering"},
            new String[]{"ENG", "English"},
            new String[]{"GED", "General Education"},
            new String[]{"ME",  "Mechanical Engineering"}
        );
        for (String[] d : depts) {
            departmentRepository.findByCode(d[0]).orElseGet(() ->
                departmentRepository.save(Department.builder().code(d[0]).name(d[1]).build()));
        }
    }

    // ── Faculty (UPSERT — fixes names on every restart) ──────────────────────

    private void upsertFaculty() {
        // Official Summer 2026 faculty table (55 members) + additional staff in routine
        // Format: shortForm, fullName, deptCode
        List<String[]> faculty = List.of(
            // ── CSE ──────────────────────────────────────────────────────────
            new String[]{"Dr. IAZ", "Dr. Ishtiaque Aziz Zahed",          "CSE"},
            new String[]{"GMD",     "Mr. Golam Moktader Daiyan",         "CSE"},
            new String[]{"SAF",     "Ms. Saraf Anika",                   "CSE"},
            new String[]{"JM",      "Mr. Joydwip Mohajon",               "CSE"},
            new String[]{"SAH",     "Mr. Md. Sabbir Al Ahsan",           "CSE"},
            new String[]{"TAZ",     "Mr. Tanvir Azhar",                  "CSE"},
            new String[]{"JHJ",     "Mr. Md. Jahidul Hasan Jahid",       "CSE"},
            new String[]{"JUD",     "Mr. Md. Jamil Uddin",               "CSE"},
            new String[]{"ARS",     "Ms. Arshiana Shamir",               "CSE"},
            new String[]{"SMI",     "Mr. Md. Siratul Mustakim Ifty",     "CSE"},
            new String[]{"MRA",     "Mr. Mohammed Morshed Rana",         "CSE"},
            new String[]{"SAB",     "Mr. Saklain Abdullah",              "CSE"},
            new String[]{"SOA",     "Mr. Sourav Adhikary",               "CSE"},
            new String[]{"SAK",     "Ms. Shahin Akter",                  "CSE"},
            new String[]{"TAS",     "Ms. Tahmina Akter Sumi",            "CSE"},
            new String[]{"TJ",      "Ms. Tasnimatul Jannah",             "CSE"},
            new String[]{"UDD",     "Mr. Udoy Das",                      "CSE"},
            new String[]{"RHN",     "Mr. Riad Hossain",                  "CSE"},
            new String[]{"PH",      "Ms. Promila Hoque",                 "CSE"},
            new String[]{"ARC",     "Ms. Arpita Chakraborty",            "CSE"},
            new String[]{"ABH",     "Mr. Abid Hossain",                  "CSE"},
            new String[]{"JNM",     "Ms. Jannatul Naima Deehan",         "CSE"},
            new String[]{"MHN",     "Mr. Mehedi Hasan Jony",             "CSE"},
            new String[]{"ANC",     "Mr. Antu Chowdhury",                "CSE"},
            new String[]{"FT",      "Ms. Fareen Tasneem",                "CSE"},
            new String[]{"SSD",     "Mr. Saleh Sakib Ahmed",             "CSE"},
            new String[]{"IMTIAZ", "Mr. Imtiaz Akber Chowdhury",         "CSE"},
            new String[]{"RUMKY",  "Ms. Tajrin Jahan Rumky",             "CSE"},
            new String[]{"YEASIN", "Mr. Md. Yeasin",                     "CSE"},
            new String[]{"ASHRAF", "Mr. Ashrafur Rahman Chowdhury",      "CSE"},
            new String[]{"MONALISA","Ms. Monalisa Tripura",              "CSE"},
            new String[]{"FARJANA","Ms. Farjana Alam Tofa",              "CSE"},
            new String[]{"NUSRAT", "Ms. Nusrat Jahan",                   "CSE"},
            new String[]{"ANB",    "Ms. Anika Bushra",                   "CSE"},
            new String[]{"TRINA",  "Ms. Trina Chakroborty",              "CSE"},
            new String[]{"MUSFEQA","Ms. Musfequa Shams",                 "CSE"},
            new String[]{"ARFAN",  "Mr. Arfan Ahmed",                    "CSE"},

            // ── EEE ──────────────────────────────────────────────────────────
            new String[]{"Dr. MK",  "Dr. K.M. Mohibul Kabir",           "EEE"},
            new String[]{"TA",      "Mr. Mohammad Toufiq Ahmed",         "EEE"},
            new String[]{"Dr. MSA", "Dr. Md. Shahidul Alam",             "EEE"},
            new String[]{"TK",      "Ms. Tania Khadem",                  "EEE"},
            new String[]{"BB",      "Mr. S.M. Baque Billah",             "EEE"},
            new String[]{"KA",      "Mr. Kazi Muhammad Asif Ashrafi",    "EEE"},
            new String[]{"SKD",     "Mr. Sanath Kumar Das",              "EEE"},
            new String[]{"JUNAYET","Mr. A.S.M. Junayet Hossain",         "EEE"},
            new String[]{"SHAMIM", "Mr. Mostaquimul Abrar Shamim",       "EEE"},
            new String[]{"AAA",    "Mr. Ahamed-Al-Arifin",               "EEE"},

            // ── GED (Math, Physics, English, Humanities) ─────────────────────
            new String[]{"SHA",    "Ms. Sharmin Akter",                  "GED"},
            new String[]{"MC",     "Mr. Mashky Chowdhury Surja",         "GED"},
            new String[]{"PRM",    "Ms. Parna Mutsuddy",                 "GED"},
            new String[]{"MSR",    "Mr. Md. Sajeed-Ur-Rahman",           "GED"},
            new String[]{"ABR",    "Mr. Angkur Barua",                   "GED"},
            new String[]{"ANJ",    "Mr. Asif Noor Jamee",                "GED"},
            new String[]{"LAM",    "Ms. Lamiya Anjum Mahi",              "GED"},
            new String[]{"SWAPNIL","Ms. Swapnil Chowdhury",              "GED"},
            new String[]{"TULY",   "Ms. Mst Tuly Khatun",                "GED"},
            new String[]{"SAMIHA", "Ms. Ishraq Samiha",                  "GED"},
            new String[]{"FARIA",  "Ms. Faria Sultana",                  "GED"}
        );

        for (String[] f : faculty) {
            jdbc.update(
                "INSERT INTO faculty (id, short_form, name, department_id) " +
                "VALUES (gen_random_uuid(), ?, ?, (SELECT id FROM departments WHERE code=?)) " +
                "ON CONFLICT (short_form) DO UPDATE SET name=EXCLUDED.name",
                f[0], f[1], f[2]);
        }
    }

    // ── Courses (UPSERT — keeps titles and credits accurate) ─────────────────

    private void upsertCourses() {
        // Format: code, title, deptCode, creditHours
        List<Object[]> courses = List.of(

            // ════ GED — Access Academy ════════════════════════════════════════
            new Object[]{"AA 099",   "Academic Reading & Writing",                          "GED", 3.0},
            new Object[]{"AA 150",   "Fundamentals of Quantitative Reasoning",              "GED", 3.0},
            new Object[]{"AA 200",   "Student Development Seminar",                         "GED", 3.0},

            // ════ GED — Language Skills ═══════════════════════════════════════
            new Object[]{"ENG 111",  "Advanced Academic Reading & Writing",                 "GED", 3.0},
            new Object[]{"ENG 112",  "Advanced Academic Listening & Speaking",              "GED", 1.5},

            // ════ GED — University Programme (UP) ════════════════════════════
            new Object[]{"BNG 101",  "Bangla Language and Literature",                      "GED", 3.0},
            new Object[]{"HIS 101",  "History of the Emergence of Bangladesh",              "GED", 3.0},
            new Object[]{"PSC 100",  "Introduction to Political Science",                   "GED", 3.0},
            new Object[]{"IGLE 300", "International Graduate Leadership Experience",        "GED", 3.0},
            new Object[]{"SOC 101",  "Introduction to Sociology",                           "GED", 3.0},
            new Object[]{"JRN 101",  "Mass Communication in Contemporary Society",          "GED", 3.0},
            new Object[]{"BCH 101",  "Bangladesh Culture and Heritage",                     "GED", 3.0},
            new Object[]{"BPH 101",  "Bangladesh Political History",                        "GED", 3.0},
            new Object[]{"PSY 101",  "Principles of Psychology",                            "GED", 3.0},
            new Object[]{"ANT 101",  "Physical Anthropology",                               "GED", 3.0},
            new Object[]{"FRN 101",  "Elementary French I",                                 "GED", 3.0},
            new Object[]{"SDA 101",  "Public Speaking",                                     "GED", 3.0},
            new Object[]{"PHI 102",  "Moral Problems",                                      "GED", 3.0},
            new Object[]{"PSC 150",  "World Politics",                                      "GED", 3.0},
            new Object[]{"ECO 203",  "Bangladesh Economy",                                  "GED", 3.0},
            new Object[]{"ENG 300",  "Critical Reading and Writing Skills",                 "GED", 3.0},
            new Object[]{"IGS 101",  "Introduction to Gender and Women's Studies",          "GED", 3.0},
            new Object[]{"IIR 101",  "Introduction to International Relations Theory",      "GED", 3.0},
            new Object[]{"WPP 101",  "Western Political Philosophy",                        "GED", 3.0},
            new Object[]{"BUS 300",  "Business Communication",                              "GED", 3.0},
            new Object[]{"HUM 105",  "Bangladesh Studies",                                  "GED", 3.0},
            new Object[]{"HUM 107",  "Industrial Management and Law",                       "GED", 3.0},
            new Object[]{"HUM 201",  "Macro & Microeconomics",                              "GED", 3.0},
            new Object[]{"HUM 203",  "Communication Skills for Engineers",                  "GED", 3.0},
            new Object[]{"HUM 211",  "Entrepreneurship for Engineers",                      "GED", 3.0},
            new Object[]{"HUM 301",  "Financial & Managerial Accounting",                   "GED", 3.0},
            new Object[]{"HUM 303",  "Sociology & Ethics",                                  "GED", 3.0},
            new Object[]{"HUM 305",  "Professional Ethics & Environmental Protection",      "GED", 3.0},
            new Object[]{"IPD 400",  "Integrated Professional Development",                 "GED", 3.0},

            // ════ GED — Basic Science ═════════════════════════════════════════
            new Object[]{"PHY 101",  "Physics",                                             "GED", 3.0},
            new Object[]{"PHY 102",  "Physics Laboratory",                                  "GED", 1.5},
            new Object[]{"CHEM 201", "Chemistry",                                           "GED", 3.0},

            // ════ GED — Mathematics ═══════════════════════════════════════════
            new Object[]{"MATH 101", "Introduction to Mathematics",                         "GED", 3.0},
            new Object[]{"MATH 103", "Engineering Mathematics",                             "GED", 3.0},
            new Object[]{"MATH 107", "Differential Calculus, Coordinate Geometry & Complex Variables", "GED", 3.0},
            new Object[]{"MATH 203", "Fourier Analysis, Laplace Transform & Differential Equations",   "GED", 3.0},
            new Object[]{"MATH 205", "Numerical Analysis",                                  "GED", 3.0},
            new Object[]{"MATH 207", "Integral Calculus, Vector Analysis & Linear Algebra", "GED", 3.0},
            new Object[]{"MATH 301", "Probability & Statistics",                            "GED", 3.0},

            // ════ ME ══════════════════════════════════════════════════════════
            new Object[]{"ME 101",   "Introduction to Mechanical Engineering",              "ME",  3.0},
            new Object[]{"ME 102",   "Engineering Drawing",                                 "ME",  1.5},

            // ════ EEE — Interdisciplinary (for CSE students) ══════════════════
            new Object[]{"EEE 111",  "Introduction to Electrical Engineering",              "EEE", 3.0},
            new Object[]{"EEE 112",  "Introduction to Electrical Engineering Laboratory",   "EEE", 1.5},
            new Object[]{"EEE 213",  "Electronics Devices & Circuits",                     "EEE", 3.0},
            new Object[]{"EEE 214",  "Electronics Devices & Circuits Laboratory",          "EEE", 1.5},
            new Object[]{"EEE 317",  "Electrical Drives & Instrumentation",                "EEE", 3.0},
            new Object[]{"EEE 318",  "Electrical Drives & Instrumentation Laboratory",     "EEE", 1.5},

            // ════ EEE — Major Courses ══════════════════════════════════════════
            new Object[]{"EEE 101",  "Electrical Circuits I",                              "EEE", 3.0},
            new Object[]{"EEE 103",  "Electrical Circuits II",                             "EEE", 3.0},
            new Object[]{"EEE 203",  "Electrical Machines I",                              "EEE", 3.0},
            new Object[]{"EEE 204",  "Electrical Machines I Laboratory",                   "EEE", 1.5},
            new Object[]{"EEE 205",  "Electronics I",                                      "EEE", 3.0},
            new Object[]{"EEE 206",  "Electronics I Laboratory",                           "EEE", 1.5},
            new Object[]{"EEE 207",  "Electrical Machines II",                             "EEE", 3.0},
            new Object[]{"EEE 217",  "Digital Electronics",                                "EEE", 3.0},
            new Object[]{"EEE 218",  "Digital Electronics Laboratory",                     "EEE", 1.5},
            new Object[]{"EEE 301",  "Electronics II",                                     "EEE", 3.0},
            new Object[]{"EEE 302",  "Electronics II Laboratory",                          "EEE", 1.5},
            new Object[]{"EEE 303",  "Signal and Systems",                                 "EEE", 3.0},
            new Object[]{"EEE 307",  "Science of Materials",                               "EEE", 3.0},
            new Object[]{"EEE 311",  "Control Systems",                                    "EEE", 3.0},
            new Object[]{"EEE 312",  "Control Systems Laboratory",                         "EEE", 1.5},
            new Object[]{"EEE 313",  "Microprocessors",                                    "EEE", 3.0},
            new Object[]{"EEE 314",  "Microprocessors Laboratory",                         "EEE", 1.5},
            new Object[]{"EEE 401",  "Power Electronics",                                  "EEE", 3.0},
            new Object[]{"EEE 402",  "Power Electronics Laboratory",                       "EEE", 1.5},
            new Object[]{"EEE 405",  "Fundamental Communication Engineering",              "EEE", 3.0},
            new Object[]{"EEE 406",  "Fundamental Communication Engineering Laboratory",   "EEE", 1.5},
            new Object[]{"EEE 407",  "Semiconductor Devices",                              "EEE", 3.0},
            new Object[]{"EEE 409",  "VLSI Design",                                        "EEE", 3.0},
            new Object[]{"EEE 410",  "VLSI Design Laboratory",                             "EEE", 1.5},
            new Object[]{"EEE 435",  "Digital Communication",                              "EEE", 3.0},
            new Object[]{"EEE 437",  "Wireless Communication",                             "EEE", 3.0},
            new Object[]{"EEE 441",  "Telecommunication Engineering",                      "EEE", 3.0},
            new Object[]{"EEE 451",  "Power System Analysis",                              "EEE", 3.0},
            new Object[]{"EEE 452",  "Power System Analysis Laboratory",                   "EEE", 1.5},
            new Object[]{"EEE 453",  "Advanced Communication",                             "EEE", 3.0},
            new Object[]{"EEE 471",  "Telecommunication Systems",                          "EEE", 3.0},

            // ════ ETE — Options for CSE ═══════════════════════════════════════
            new Object[]{"ETE 309",  "Digital Signal Processing",                          "ETE", 3.0},
            new Object[]{"ETE 310",  "Digital Signal Processing Laboratory",               "ETE", 1.5},
            new Object[]{"ETE 431",  "Mobile Cellular & Wireless Communication",           "ETE", 3.0},
            new Object[]{"ETE 435",  "Digital Communication",                              "ETE", 3.0},
            new Object[]{"ETE 436",  "Digital Communication Laboratory",                   "ETE", 1.5},

            // ════ CSE — Interdisciplinary ═════════════════════════════════════
            new Object[]{"CSE 103",  "Introduction to Computer Science",                   "CSE", 3.0},
            new Object[]{"CSE 104",  "Introduction to Computer Science Laboratory",        "CSE", 1.5},
            new Object[]{"CSE 223",  "Digital Electronics & Pulse Technique",              "CSE", 3.0},
            new Object[]{"CSE 224",  "Digital Electronics & Pulse Technique Laboratory",   "CSE", 1.5},

            // ════ CSE — Program Core ══════════════════════════════════════════
            new Object[]{"CSE 111",  "Computer Fundamentals and Programming Basics",       "CSE", 3.0},
            new Object[]{"CSE 112",  "Computer Fundamentals and Programming Basics Laboratory", "CSE", 1.5},
            new Object[]{"CSE 113",  "Structured Programming Language",                    "CSE", 3.0},
            new Object[]{"CSE 114",  "Structured Programming Language Laboratory",         "CSE", 1.5},
            new Object[]{"CSE 115",  "Discrete Mathematics",                               "CSE", 3.0},
            new Object[]{"CSE 123",  "Object Oriented Programming Language",               "CSE", 3.0},
            new Object[]{"CSE 124",  "Object Oriented Programming Language Laboratory",    "CSE", 1.5},
            new Object[]{"CSE 211",  "Data Structure",                                     "CSE", 3.0},
            new Object[]{"CSE 212",  "Data Structure Laboratory",                          "CSE", 1.5},
            new Object[]{"CSE 215",  "Digital Logic Design",                               "CSE", 4.0},
            new Object[]{"CSE 216",  "Digital Logic Design Laboratory",                    "CSE", 1.5},
            new Object[]{"CSE 221",  "Algorithms",                                         "CSE", 3.0},
            new Object[]{"CSE 222",  "Algorithms Laboratory",                              "CSE", 1.5},
            new Object[]{"CSE 225",  "Database Management System",                         "CSE", 3.0},
            new Object[]{"CSE 226",  "Database Management System Laboratory",              "CSE", 1.5},
            new Object[]{"CSE 242",  "Web Development",                                    "CSE", 1.5},
            new Object[]{"CSE 311",  "Operating System",                                   "CSE", 3.0},
            new Object[]{"CSE 312",  "Operating System Laboratory",                        "CSE", 1.5},
            new Object[]{"CSE 313",  "Data Communication",                                 "CSE", 3.0},
            new Object[]{"CSE 315",  "Microprocessor and Interfacing",                     "CSE", 3.0},
            new Object[]{"CSE 316",  "Microprocessor and Interfacing Laboratory",          "CSE", 1.5},
            new Object[]{"CSE 317",  "Computer Organization and Architecture",             "CSE", 3.0},
            new Object[]{"CSE 319",  "Compiler Design",                                    "CSE", 3.0},
            new Object[]{"CSE 320",  "Compiler Design Laboratory",                         "CSE", 1.5},
            new Object[]{"CSE 321",  "Computer Graphics",                                  "CSE", 3.0},
            new Object[]{"CSE 322",  "Computer Graphics Laboratory",                       "CSE", 1.5},
            new Object[]{"CSE 325",  "Computer Networks",                                  "CSE", 3.0},
            new Object[]{"CSE 326",  "Computer Networks Laboratory",                       "CSE", 1.5},
            new Object[]{"CSE 327",  "Artificial Intelligence",                            "CSE", 3.0},
            new Object[]{"CSE 328",  "Artificial Intelligence Laboratory",                 "CSE", 1.5},
            new Object[]{"CSE 342",  "IoT Based Project Development",                      "CSE", 1.5},
            new Object[]{"CSE 411",  "Software Engineering",                               "CSE", 3.0},
            new Object[]{"CSE 443",  "Neural Network and Fuzzy Systems",                   "CSE", 3.0},
            new Object[]{"CSE 463",  "Machine Learning for Big Data Analytics",            "CSE", 3.0},
            new Object[]{"CSE 464",  "Python Based Project Development",                   "CSE", 1.5},
            new Object[]{"CSE 466",  "Mobile App Development",                             "CSE", 1.5},
            new Object[]{"CSE 400",  "Project / Thesis",                                   "CSE", 6.0},

            // ════ CSE — Options ═══════════════════════════════════════════════
            new Object[]{"CSE 301",  "Data Warehousing and Mining",                        "CSE", 3.0},
            new Object[]{"CSE 303",  "Introduction to Bioinformatics",                     "CSE", 3.0},
            new Object[]{"CSE 307",  "Mobile Computing and Applications",                  "CSE", 3.0},
            new Object[]{"CSE 308",  "Mobile Computing and Applications Laboratory",       "CSE", 1.5},
            new Object[]{"CSE 309",  "Distributed Systems",                                "CSE", 3.0},
            new Object[]{"CSE 337",  "Multimedia Theory",                                  "CSE", 3.0},
            new Object[]{"CSE 429",  "Software Project Management",                        "CSE", 3.0},
            new Object[]{"CSE 435",  "Pattern Recognition",                                "CSE", 3.0},
            new Object[]{"CSE 436",  "Pattern Recognition Laboratory",                     "CSE", 1.5},
            new Object[]{"CSE 439",  "Digital Image Processing",                           "CSE", 3.0},
            new Object[]{"CSE 440",  "Digital Image Processing Laboratory",                "CSE", 1.5},
            new Object[]{"CSE 447",  "Robotics",                                           "CSE", 3.0},
            new Object[]{"CSE 455",  "Business Process Reengineering",                     "CSE", 3.0},
            new Object[]{"CSE 457",  "Cyber Security",                                     "CSE", 3.0},
            new Object[]{"CSE 459",  "Network Security",                                   "CSE", 3.0}
        );

        for (Object[] c : courses) {
            jdbc.update(
                "INSERT INTO courses (id, code, title, department_id, credit_hours) " +
                "VALUES (gen_random_uuid(), ?, ?, (SELECT id FROM departments WHERE code=?), ?) " +
                "ON CONFLICT (code) DO UPDATE SET " +
                "title=EXCLUDED.title, credit_hours=EXCLUDED.credit_hours, department_id=EXCLUDED.department_id",
                c[0], c[1], c[2], c[3]);
        }
    }

    // ── Admin accounts ────────────────────────────────────────────────────────

    private void seedAdminAccounts() {
        String password = prop("ADMIN_DEFAULT_PASSWORD", "ChangeMe@2025!");
        String email    = prop("ADMIN_EMAIL_1",          "admin1@eastdelta.edu.bd");
        String name     = prop("ADMIN_NAME_1",           "Admin One");
        String id       = prop("ADMIN_ID_1",             "ADM-001");

        if (!userRepository.existsByEmail(email)) {
            userRepository.save(User.builder()
                    .studentId(id).name(name).email(email)
                    .passwordHash(passwordEncoder.encode(password))
                    .role(User.Role.ADMIN).emailVerified(true).build());
            log.info("Created admin: {}", email);
        }
    }

    private String prop(String key, String defaultValue) {
        return springEnv.getProperty(key, defaultValue);
    }
}
