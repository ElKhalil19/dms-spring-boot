package com.example.service_d;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/documents")
public class DocumentController {

    private final DocumentService service;

    public DocumentController(DocumentService service) {
        this.service = service;
    }

    @GetMapping("/list")
    public List<Document> list() {
        return service.getAllDocuments();
    }

    @GetMapping
    public List<Document> listAll() {
        return service.getAllDocuments();
    }

    @GetMapping("/get/{id}")
    public Document get(@PathVariable Long id) {
        return service.getDocumentById(id);
    }

    @GetMapping("/{id}")
    public Document getById(@PathVariable Long id) {
        return service.getDocumentById(id);
    }

    @PostMapping("/add")
    public Document add(@RequestBody Document doc) {
        return service.addDocument(doc);
    }

    @PostMapping
    public Document create(@RequestBody Document doc) {
        return service.addDocument(doc);
    }

    @DeleteMapping("/delete/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteDocument(id);
    }

    @DeleteMapping("/{id}")
    public void deleteById(@PathVariable Long id) {
        service.deleteDocument(id);
    }

    @PutMapping("/update/{id}")
    public Document update(@PathVariable Long id, @RequestBody Document doc) {
        return service.updateDocument(id, doc);
    }

    @PatchMapping("/{id}")
    public Document patch(@PathVariable Long id, @RequestBody Document doc) {
        return service.updateDocument(id, doc);
    }
}
