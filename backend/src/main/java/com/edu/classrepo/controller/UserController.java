package com.edu.classrepo.controller;

import com.edu.classrepo.entity.User;
import com.edu.classrepo.exception.ResourceNotFoundException;
import com.edu.classrepo.repository.UserRepository;
import com.edu.classrepo.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final StorageService storageService;

    @GetMapping("/me")
    public ResponseEntity<User> me(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(
            userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId))
        );
    }

    @PostMapping("/me/profile-pic")
    public ResponseEntity<Map<String, String>> uploadProfilePic(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UUID userId
    ) throws IOException {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        String url = storageService.uploadProfilePic(file, userId);
        user.setProfilePicUrl(url);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("profilePicUrl", url));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UUID userId
    ) {
        // Handled in AuthService for full security context; placeholder here
        return ResponseEntity.noContent().build();
    }
}
