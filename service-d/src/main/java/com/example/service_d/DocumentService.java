package com.example.service_d;

import java.util.Collections;
import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DocumentService {

    private final DocumentRepository repository;
    private final DocumentEventProducer eventProducer;

    public DocumentService(DocumentRepository repository, DocumentEventProducer eventProducer) {
        this.repository = repository;
        this.eventProducer = eventProducer;
    }

    public List<Document> getAllDocuments() {
        return repository.findAll();
    }

    @Cacheable(value = "documents", key = "#id")
    public Document getDocumentById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Transactional
    @CachePut(value = "documents", key = "#result.id")
    public Document addDocument(Document doc) {
        if (doc.getCurrentVersion() == null) {
            doc.setCurrentVersion(1);
        }
        if (doc.getStatus() == null) {
            doc.setStatus("draft");
        }
        if (doc.getTags() == null) {
            doc.setTags(Collections.emptyList());
        }
        if (doc.getSourceLanguage() == null || doc.getSourceLanguage().isBlank()) {
            doc.setSourceLanguage("auto");
        }
        
        // 1. Save to PostgreSQL
        Document saved = repository.save(doc);
        
        // 2. Publish to Kafka
        eventProducer.publishDocumentUploaded(
                new DocumentUploadedEvent(saved.getId(), saved.getTitle(), saved.getSourceLanguage(), saved.getCreatedAt()));
                
        // 3. Return saves the result to Redis cache via @CachePut
        return saved;
    }

    @Transactional
    @CacheEvict(value = "documents", key = "#id")
    public void deleteDocument(Long id) {
        repository.deleteById(id);
    }

    @Transactional
    @CachePut(value = "documents", key = "#id") // Changed from CacheEvict to keep cache warm
    public Document updateDocument(Long id, Document doc) {
        Document existing = repository.findById(id).orElseThrow();
        
        if (doc.getTitle() != null) existing.setTitle(doc.getTitle());
        if (doc.getDescription() != null) existing.setDescription(doc.getDescription());
        if (doc.getStatus() != null) existing.setStatus(doc.getStatus());
        if (doc.getTags() != null) existing.setTags(doc.getTags());
        if (doc.getCategoryId() != null) existing.setCategoryId(doc.getCategoryId());
        if (doc.getDepartmentId() != null) existing.setDepartmentId(doc.getDepartmentId());
        if (doc.getCurrentVersion() != null) existing.setCurrentVersion(doc.getCurrentVersion());
        if (doc.getFileName() != null) existing.setFileName(doc.getFileName());
        if (doc.getS3Key() != null) existing.setS3Key(doc.getS3Key());
        if (doc.getUploadedBy() != null) existing.setUploadedBy(doc.getUploadedBy());
        if (doc.getUpdatedAt() != null) existing.setUpdatedAt(doc.getUpdatedAt());
        if (doc.getTranslatedTitle() != null) existing.setTranslatedTitle(doc.getTranslatedTitle());
        if (doc.getSourceLanguage() != null) existing.setSourceLanguage(doc.getSourceLanguage());
        if (doc.getTargetLanguage() != null) existing.setTargetLanguage(doc.getTargetLanguage());
        
        return repository.save(existing);
    }
}
