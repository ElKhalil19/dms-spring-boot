package com.example.service_g;

import java.util.Collections;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api")
public class ProxyController {

    private final RestTemplate restTemplate = new RestTemplate();

    // Proxy /api/departments to documents service
    @GetMapping("/departments")
    public ResponseEntity<?> proxyDepartments() {
        Object body = restTemplate.getForObject("http://documents:8081/api/departments", Object.class);
        if (body == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        return ResponseEntity.ok(body);
    }

    // Proxy /api/categories to documents service
    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        Object body = restTemplate.getForObject("http://documents:8081/api/categories", Object.class);
        if (body == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        return ResponseEntity.ok(body);
    }

    // Proxy /api/activityLogs to documents service
    @GetMapping("/activityLogs")
    public ResponseEntity<?> getActivityLogs() {
        Object body = restTemplate.getForObject("http://documents:8081/api/activityLogs", Object.class);
        if (body == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        return ResponseEntity.ok(body);
    }

    @PostMapping("/s3/presign")
public ResponseEntity<?> proxyPresign(@RequestBody(required=false) String body, @RequestHeader HttpHeaders headers) {
    HttpEntity<String> requestEntity = new HttpEntity<>(body, headers);
    ResponseEntity<String> response = restTemplate.exchange(
        "http://s3:8010/s3/presign",
        HttpMethod.POST,
        requestEntity,
        String.class
    );
    return ResponseEntity.status(response.getStatusCode()).headers(response.getHeaders()).body(response.getBody());
}

@PostMapping("/comments")
public ResponseEntity<?> proxyComments(
        @RequestBody String body,
        @RequestHeader HttpHeaders headers
) {
    HttpEntity<String> requestEntity = new HttpEntity<>(body, headers);

    ResponseEntity<String> response = restTemplate.exchange(
        "http://comments:8083/comments", // ✅ FIXED PORT
        HttpMethod.POST,
        requestEntity,
        String.class
    );

    return ResponseEntity
            .status(response.getStatusCode())
            .headers(response.getHeaders())
            .body(response.getBody());
}
@GetMapping("/comments")
public ResponseEntity<?> proxyGetComments(@RequestParam Long documentId) {
    String url = "http://comments:8083/comments?documentId=" + documentId;

    Object body = restTemplate.getForObject(url, Object.class);

    return ResponseEntity.ok(body);
}
@PostMapping("/documents")
    public ResponseEntity<?> proxyCreateDocument(@RequestBody String body, @RequestHeader HttpHeaders headers) {
        HttpEntity<String> requestEntity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.exchange(
            "http://documents:8081/api/documents", 
            HttpMethod.POST,
            requestEntity,
            String.class
        );
        return ResponseEntity
                .status(response.getStatusCode())
                .headers(response.getHeaders())
                .body(response.getBody());
    }

    // You will probably need this one too to fetch the documents!
    // Proxy GET /api/documents to documents service
    @GetMapping("/documents")
    public ResponseEntity<?> proxyGetDocuments() {
        Object body = restTemplate.getForObject("http://documents:8081/api/documents", Object.class);
        if (body == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        return ResponseEntity.ok(body);
    }
}