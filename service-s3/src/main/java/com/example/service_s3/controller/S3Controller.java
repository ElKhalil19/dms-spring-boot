package com.example.service_s3.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders; // <--- MUST BE THIS ONE
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import java.io.IOException;

@RestController
@RequestMapping("/s3")
public class S3Controller {

    @Autowired
    private S3Client s3Client;

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
                    // This is the most important line for debugging!
                    System.err.println("S3 ERROR: " + e.getMessage());
                    e.printStackTrace(); 
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(("Error: " + e.getMessage()).getBytes());
                }
    }
    @PostMapping("/upload")
    public String uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            // Inside your uploadFile method
        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unnamed_file";
                
        s3Client.putObject(PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName) // Use the safe variable
                .build(),
                RequestBody.fromBytes(file.getBytes()));
            return "Upload Successful: " + file.getOriginalFilename();
        } catch (Exception e) {
            return "Upload Failed: " + e.getMessage();
        }
    }
}

