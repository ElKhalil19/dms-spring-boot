package com.example.service_s3;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

@RestController
@RequestMapping("/s3")
public class S3Controller {

    @Autowired
    private S3Client s3Client;

    @Autowired
    private S3Presigner s3Presigner;

    @Value("${app.s3.bucket}")
    private String bucketName;

    @GetMapping("/document/lab4")
    public ResponseEntity<byte[]> getLab4() {
        try {
            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key("LAB_4_DOCKER.pdf")
                    .build();

            ResponseBytes<GetObjectResponse> objectBytes = s3Client.getObjectAsBytes(request);
            
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"LAB_4_DOCKER.pdf\"")
                    .body(objectBytes.asByteArray());
        } catch (Exception e) {
            System.err.println("S3 ERROR: " + e.getMessage());
            e.printStackTrace(); 
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(("Error: " + e.getMessage()).getBytes());
        }
    }

    @PostMapping("/upload")
    public String uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unnamed_file";
                
            s3Client.putObject(PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileName)
                    .build(),
                    software.amazon.awssdk.core.sync.RequestBody.fromBytes(file.getBytes()));
            return "Upload Successful: " + file.getOriginalFilename();
        } catch (Exception e) {
            return "Upload Failed: " + e.getMessage();
        }
    }

    @GetMapping("/presign-download")
    public PresignDownloadResponse presignDownload(@RequestParam("key") String key) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();
        PresignedGetObjectRequest presignedGetObjectRequest = s3Presigner.presignGetObject(
                GetObjectPresignRequest.builder()
                        .signatureDuration(Duration.ofMinutes(15))
                        .getObjectRequest(getObjectRequest)
                        .build()
        );
        
        // Use the generated URL directly without string replacement
        String publicUrl = presignedGetObjectRequest.url().toString();
        
        return new PresignDownloadResponse(
                publicUrl,
                key,
                Instant.now().plus(Duration.ofMinutes(15)).toString()
        );
    }

    @PostMapping("/presign")
    public PresignUploadResponse presignUpload(@RequestBody PresignUploadRequest request) {
        String key = UUID.randomUUID() + "-" + request.fileName().replaceAll("\\s+", "_");

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();

        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(
                PutObjectPresignRequest.builder()
                        .signatureDuration(Duration.ofMinutes(15))
                        .putObjectRequest(putObjectRequest)
                        .build());

        // Use the generated URL directly without string replacement
        String publicUrl = presignedRequest.url().toString();

        return new PresignUploadResponse(
                publicUrl,
                key,
                Instant.now().plus(Duration.ofMinutes(15)).toString()
        );
    }
}

record PresignDownloadResponse(String downloadUrl, String key, String expiresAt) {}

record PresignUploadRequest(String fileName, String contentType) {}

record PresignUploadResponse(String uploadUrl, String key, String expiresAt) {}