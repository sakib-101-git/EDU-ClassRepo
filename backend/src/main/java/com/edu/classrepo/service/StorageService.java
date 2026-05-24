package com.edu.classrepo.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${app.r2.bucket}")
    private String bucket;

    @Value("${app.r2.public-url}")
    private String publicUrl;

    /** Upload a file and return its public URL (or R2 object key for private files). */
    public String uploadMaterial(MultipartFile file, UUID courseId, UUID uploaderId) throws IOException {
        String ext = getExtension(file.getOriginalFilename());
        String key = "materials/%s/%s/%s%s".formatted(courseId, uploaderId, UUID.randomUUID(), ext);

        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(file.getContentType())
                        .contentLength(file.getSize())
                        .build(),
                RequestBody.fromInputStream(file.getInputStream(), file.getSize())
        );

        return publicUrl + "/" + key;
    }

    /** Upload a profile picture and return its public URL. */
    public String uploadProfilePic(MultipartFile file, UUID userId) throws IOException {
        String ext = getExtension(file.getOriginalFilename());
        String key = "profiles/%s%s".formatted(userId, ext);

        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(file.getContentType())
                        .contentLength(file.getSize())
                        .build(),
                RequestBody.fromInputStream(file.getInputStream(), file.getSize())
        );

        return publicUrl + "/" + key;
    }

    /** Generate a time-limited presigned download URL for private objects. */
    public String generatePresignedUrl(String objectKey, Duration expiry) {
        var presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(expiry)
                .getObjectRequest(GetObjectRequest.builder()
                        .bucket(bucket)
                        .key(objectKey)
                        .build())
                .build();

        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }

    /** Delete an object by its full URL or key. */
    public void delete(String fileUrl) {
        String key = fileUrl.replace(publicUrl + "/", "");
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
        } catch (Exception e) {
            log.warn("Failed to delete R2 object {}: {}", key, e.getMessage());
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.'));
    }
}
