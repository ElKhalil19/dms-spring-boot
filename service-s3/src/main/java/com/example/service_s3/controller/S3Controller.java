package com.example.service_s3.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

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
                    RequestBody.fromBytes(file.getBytes()));
            return "Upload Successful: " + file.getOriginalFilename();
        } catch (Exception e) {
            return "Upload Failed: " + e.getMessage();
        }
    }

    /**
     * Returns a pre-signed URL for client-side file upload directly to S3.
     * The URL expires in 1 hour.
     */
    @PostMapping("/presigned-upload")
    public ResponseEntity<Map<String, String>> getPresignedUploadUrl(
            @RequestParam(value = "filename", required = false) String filename) {
        String key = "uploads/" + UUID.randomUUID() + (filename != null ? "-" + filename : "");
        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofHours(1))
                .putObjectRequest(r -> r.bucket(bucketName).key(key))
                .build();
        String url = s3Presigner.presignPutObject(presignRequest).url().toString();
        return ResponseEntity.ok(Map.of("url", url, "key", key));
    }

    /**
     * Returns a pre-signed URL for downloading a file from S3.
     * The URL expires in 1 hour.
     */
    @GetMapping("/presigned-download")
    public ResponseEntity<Map<String, String>> getPresignedDownloadUrl(@RequestParam("key") String key) {
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofHours(1))
                .getObjectRequest(r -> r.bucket(bucketName).key(key))
                .build();
        String url = s3Presigner.presignGetObject(presignRequest).url().toString();
        return ResponseEntity.ok(Map.of("url", url, "key", key));
    }
}

