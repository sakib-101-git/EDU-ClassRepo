package com.edu.classrepo.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data @Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private long expiresIn;
    private UserSummary user;

    @Data @Builder
    public static class UserSummary {
        private UUID id;
        private String studentId;
        private String name;
        private String email;
        private String role;
        private DeptSummary department;
        private String gender;
        private Integer semesterNumber;
        private String profilePicUrl;
    }

    @Data @Builder
    public static class DeptSummary {
        private String code;
        private String name;
    }
}
