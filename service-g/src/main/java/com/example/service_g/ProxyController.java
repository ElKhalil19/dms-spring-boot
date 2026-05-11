package com.example.service_g;

import com.example.service_g.auth.JwtService;
import com.example.service_g.auth.UserAccount;
import com.example.service_g.auth.UserStore;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class ProxyController {

    private static final Logger log = LoggerFactory.getLogger(ProxyController.class);
    private static final String DOCUMENTS_BASE_URL = "http://documents:8081";
    private static final String COMMENTS_BASE_URL = "http://comments:8083";
    private static final String S3_BASE_URL = "http://s3:8010";

    private final RestTemplate restTemplate = new RestTemplate();
    private final JwtService jwtService;
    private final UserStore userStore;

    public ProxyController(JwtService jwtService, UserStore userStore) {
        this.jwtService = jwtService;
        this.userStore = userStore;
    }

    @GetMapping("/departments")
    public ResponseEntity<?> getDepartments() {
        return proxyGetOrEmptyList(DOCUMENTS_BASE_URL + "/api/departments");
    }

    @PostMapping("/departments")
    public ResponseEntity<?> createDepartment(@RequestBody(required = false) String body, @RequestHeader HttpHeaders headers) {
        return proxyExchange(DOCUMENTS_BASE_URL + "/api/departments", HttpMethod.POST, body, headers);
    }

    @PatchMapping("/departments/{id}")
    public ResponseEntity<?> updateDepartment(@PathVariable Long id, @RequestBody(required = false) String body, @RequestHeader HttpHeaders headers) {
        return proxyExchange(DOCUMENTS_BASE_URL + "/api/departments/" + id, HttpMethod.PATCH, body, headers);
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        return proxyGetOrEmptyList(DOCUMENTS_BASE_URL + "/api/categories");
    }

    @PostMapping("/categories")
    public ResponseEntity<?> createCategory(@RequestBody(required = false) String body, @RequestHeader HttpHeaders headers) {
        return proxyExchange(DOCUMENTS_BASE_URL + "/api/categories", HttpMethod.POST, body, headers);
    }

    @GetMapping("/activityLogs")
    public ResponseEntity<?> getActivityLogs() {
        try {
            Object body = restTemplate.getForObject(DOCUMENTS_BASE_URL + "/api/activityLogs", Object.class);
            return ResponseEntity.ok(body == null ? Collections.emptyList() : body);
        } catch (Exception ex) {
            log.warn("Failed to load activity logs: {}", ex.getMessage());
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @PostMapping("/s3/presign")
    public ResponseEntity<?> presignUpload(@RequestBody(required = false) String body, @RequestHeader HttpHeaders headers) {
        return proxyExchange(S3_BASE_URL + "/s3/presign", HttpMethod.POST, body, headers);
    }

    @GetMapping("/s3/presign-download")
    public ResponseEntity<?> presignDownload(@RequestParam String key) {
        try {
            Object body = restTemplate.getForObject(S3_BASE_URL + "/s3/presign-download?key={key}", Object.class, key);
            return ResponseEntity.ok(body);
        } catch (Exception ex) {
            log.error("Failed to presign download for key {}: {}", key, ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("Failed to presign download URL");
        }
    }

    @PostMapping("/documents")
    public ResponseEntity<?> createDocument(@RequestBody Map<String, Object> body, @RequestHeader HttpHeaders headers) {
        UserAccount user = resolveCurrentUser(headers);
        Long departmentId = asLong(body.get("departmentId"));
        if (departmentId == null) {
            return ResponseEntity.badRequest().body("departmentId is required");
        }
        if (!isAllowedDepartment(user, departmentId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }
        return proxyExchange(DOCUMENTS_BASE_URL + "/documents", HttpMethod.POST, body, headers);
    }

    @GetMapping("/documents")
    public ResponseEntity<?> getDocuments(@RequestHeader HttpHeaders headers) {
        UserAccount user = resolveCurrentUser(headers);
        try {
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    DOCUMENTS_BASE_URL + "/documents",
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {}
            );
            List<Map<String, Object>> documents = response.getBody();
            if (documents == null) {
                return ResponseEntity.ok(Collections.emptyList());
            }
            if (isAdmin(user)) {
                return ResponseEntity.ok(documents);
            }
            List<Map<String, Object>> filtered = documents.stream()
                    .filter(doc -> isAllowedDepartment(user, asLong(doc.get("departmentId"))))
                    .toList();
            return ResponseEntity.ok(filtered);
        } catch (Exception ex) {
            log.error("Failed to load documents: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("Failed to load documents");
        }
    }

    @GetMapping("/documents/{id}")
    public ResponseEntity<?> getDocumentById(@PathVariable Long id, @RequestHeader HttpHeaders headers) {
        UserAccount user = resolveCurrentUser(headers);
        if (!canAccessDocument(user, id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }
        try {
            Object body = restTemplate.getForObject(DOCUMENTS_BASE_URL + "/documents/{id}", Object.class, id);
            return body == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(body);
        } catch (Exception ex) {
            log.error("Failed to load document {}: {}", id, ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("Failed to load document");
        }
    }

    @PatchMapping("/documents/{id}")
    public ResponseEntity<?> patchDocument(@PathVariable Long id, @RequestBody Map<String, Object> body, @RequestHeader HttpHeaders headers) {
        UserAccount user = resolveCurrentUser(headers);
        if (!canAccessDocument(user, id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }
        Long departmentId = asLong(body.get("departmentId"));
        if (departmentId != null && !isAllowedDepartment(user, departmentId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }
        return proxyExchange(DOCUMENTS_BASE_URL + "/documents/" + id, HttpMethod.PATCH, body, headers);
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id, @RequestHeader HttpHeaders headers) {
        UserAccount user = resolveCurrentUser(headers);
        if (!canAccessDocument(user, id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }
        return proxyExchange(DOCUMENTS_BASE_URL + "/documents/" + id, HttpMethod.DELETE, null, headers);
    }

    @PostMapping("/comments")
    public ResponseEntity<?> addComment(@RequestBody Map<String, Object> body, @RequestHeader HttpHeaders headers) {
        UserAccount user = resolveCurrentUser(headers);
        Long documentId = asLong(body.get("documentId"));
        if (documentId == null) {
            return ResponseEntity.badRequest().body("documentId is required");
        }
        if (!canAccessDocument(user, documentId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }
        return proxyExchange(COMMENTS_BASE_URL + "/comments", HttpMethod.POST, body, headers);
    }

    @GetMapping("/comments")
    public ResponseEntity<?> getComments(@RequestParam Long documentId, @RequestHeader HttpHeaders headers) {
        UserAccount user = resolveCurrentUser(headers);
        if (!canAccessDocument(user, documentId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
        }
        try {
            Object body = restTemplate.getForObject(COMMENTS_BASE_URL + "/comments?documentId={documentId}", Object.class, documentId);
            return ResponseEntity.ok(body == null ? Collections.emptyList() : body);
        } catch (Exception ex) {
            log.error("Failed to load comments for document {}: {}", documentId, ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("Failed to load comments");
        }
    }

    private ResponseEntity<?> proxyGetOrEmptyList(String url) {
        try {
            Object body = restTemplate.getForObject(url, Object.class);
            return ResponseEntity.ok(body == null ? Collections.emptyList() : body);
        } catch (Exception ex) {
            log.error("Failed proxy GET {}: {}", url, ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Collections.emptyList());
        }
    }

    private ResponseEntity<?> proxyExchange(String url, HttpMethod method, Object body, HttpHeaders incomingHeaders) {
        try {
            HttpHeaders forwardedHeaders = new HttpHeaders();
            if (body != null && incomingHeaders.getContentType() != null) {
                forwardedHeaders.setContentType(incomingHeaders.getContentType());
            } else if (body != null) {
                forwardedHeaders.setContentType(MediaType.APPLICATION_JSON);
            }
            HttpEntity<Object> requestEntity = new HttpEntity<>(body, forwardedHeaders);
            ResponseEntity<String> response = restTemplate.exchange(url, method, requestEntity, String.class);
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (Exception ex) {
            log.error("Failed proxy {} {}: {}", method, url, ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("Upstream service call failed");
        }
    }

    private UserAccount resolveCurrentUser(HttpHeaders headers) {
        String authHeader = headers.getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing or invalid Authorization header");
        }
        String token = authHeader.substring("Bearer ".length());
        Jws<Claims> claims = jwtService.parseToken(token);
        Long userId = Long.parseLong(claims.getPayload().getSubject());
        return userStore.getAccount(userId).orElseThrow();
    }

    private boolean canAccessDocument(UserAccount user, Long documentId) {
        if (isAdmin(user)) {
            return true;
        }
        try {
            Map<String, Object> document = restTemplate.getForObject(
                    DOCUMENTS_BASE_URL + "/documents/{id}",
                    Map.class,
                    documentId
            );
            return document != null && isAllowedDepartment(user, asLong(document.get("departmentId")));
        } catch (Exception ex) {
            log.error("Failed to verify access for document {}: {}", documentId, ex.getMessage());
            return false;
        }
    }

    private boolean isAllowedDepartment(UserAccount user, Long departmentId) {
        if (isAdmin(user)) {
            return true;
        }
        if (departmentId == null) {
            return false;
        }
        return allowedDepartments(user).contains(departmentId);
    }

    private boolean isAdmin(UserAccount user) {
        return user != null && "admin".equalsIgnoreCase(user.role());
    }

    private List<Long> allowedDepartments(UserAccount user) {
        if (user == null) {
            return Collections.emptyList();
        }
        List<Long> ids = new ArrayList<>();
        if (user.departmentIds() != null) {
            ids.addAll(user.departmentIds());
        }
        if (user.departmentId() != null && !ids.contains(user.departmentId())) {
            ids.add(user.departmentId());
        }
        return ids;
    }

    private Long asLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
