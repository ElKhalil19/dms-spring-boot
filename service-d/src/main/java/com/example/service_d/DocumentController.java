package com.example.service_d;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/documents")
public class DocumentController {

    private final DocumentRepository repository;

    public DocumentController(DocumentRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/list")
    public List<Document> list() {
        return repository.findAll();
    }

    @GetMapping("/get/{id}")
    public Document get(@PathVariable Long id) {
        return repository.findById(id).orElse(null);
    }

    @PostMapping("/add")
    public Document add(@RequestBody Document doc) {
        return repository.save(doc);
    }
}