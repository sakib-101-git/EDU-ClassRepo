package com.edu.classrepo.dto.request;

import com.edu.classrepo.entity.User;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank
    @Size(min = 2, max = 100)
    private String name;

    @Size(max = 50)
    private String studentId;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 5, max = 100)
    private String password;

    private String departmentCode;

    private User.Gender gender;

    @Min(1) @Max(12)
    private Integer semesterNumber;
}
