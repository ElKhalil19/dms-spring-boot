package com.example.service_d;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DocumentService {

    private final DocumentRepository repository;

    public DocumentService(DocumentRepository repository) {
        this.repository = repository;
    }

    public List<Document> getAllDocuments() {
        return repository.findAll();
    }

    @Cacheable(value = "documents", key = "#id")
    public Document getDocumentById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @CachePut(value = "documents", key = "#result.id")
    public Document addDocument(Document doc) {
        return repository.save(doc);
    }

    @CacheEvict(value = "documents", key = "#id")
    public void deleteDocument(Long id) {
        repository.deleteById(id);
    }

    @CacheEvict(value = "documents", key = "#id")
    public Document updateDocument(Long id, Document doc) {
        Document existing = repository.findById(id).orElseThrow();
        existing.setTitle(doc.getTitle());
        return repository.save(existing);
    }
}
