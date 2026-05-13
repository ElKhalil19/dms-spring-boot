package com.example.service_d;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/versions")
public class DocumentVersionController {

    private final DocumentVersionRepository repository;

    public DocumentVersionController(DocumentVersionRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<DocumentVersion> byDocument(@RequestParam("documentId") Long documentId) {
        return repository.findByDocumentIdOrderByVersionDesc(documentId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentVersion create(@RequestBody DocumentVersion version) {
        if (version.getCreatedAt() == null) {
            version.setCreatedAt(Instant.now());
        }
        return repository.save(version);
    }
}
