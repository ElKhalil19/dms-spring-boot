package com.example.service_d;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Collections;

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
        Document saved = repository.save(doc);
        eventProducer.publishDocumentUploaded(
                new DocumentUploadedEvent(saved.getId(), saved.getTitle(), saved.getCreatedAt()));
        return saved;
    }

    @CacheEvict(value = "documents", key = "#id")
    public void deleteDocument(Long id) {
        repository.deleteById(id);
    }

    @CacheEvict(value = "documents", key = "#id")
    public Document updateDocument(Long id, Document doc) {
        Document existing = repository.findById(id).orElseThrow();
        if (doc.getTitle() != null) {
            existing.setTitle(doc.getTitle());
        }
        if (doc.getDescription() != null) {
            existing.setDescription(doc.getDescription());
        }
        if (doc.getStatus() != null) {
            existing.setStatus(doc.getStatus());
        }
        if (doc.getTags() != null) {
            existing.setTags(doc.getTags());
        }
        if (doc.getCategoryId() != null) {
            existing.setCategoryId(doc.getCategoryId());
        }
        if (doc.getDepartmentId() != null) {
            existing.setDepartmentId(doc.getDepartmentId());
        }
        if (doc.getCurrentVersion() != null) {
            existing.setCurrentVersion(doc.getCurrentVersion());
        }
        if (doc.getFileName() != null) {
            existing.setFileName(doc.getFileName());
        }
        if (doc.getS3Key() != null) {
            existing.setS3Key(doc.getS3Key());
        }
        if (doc.getUploadedBy() != null) {
            existing.setUploadedBy(doc.getUploadedBy());
        }
        if (doc.getUpdatedAt() != null) {
            existing.setUpdatedAt(doc.getUpdatedAt());
        }
        return repository.save(existing);
    }
}
