package com.example.service_d;

import com.example.service_d.event.DocumentCreatedEvent;
import com.example.service_d.event.DocumentEventPublisher;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class DocumentService {

    private final DocumentRepository repository;
    private final DocumentEventPublisher eventPublisher;

    public DocumentService(DocumentRepository repository, DocumentEventPublisher eventPublisher) {
        this.repository = repository;
        this.eventPublisher = eventPublisher;
    }

    @Cacheable(value = "documents")
    public List<Document> getAllDocuments() {
        return repository.findAll();
    }

    @Cacheable(value = "documents", key = "#id")
    public Document getDocumentById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @CacheEvict(value = "documents", allEntries = true)
    public Document addDocument(Document doc, String owner) {
        doc.setOwner(owner);
        Document saved = repository.save(doc);
        eventPublisher.publishDocumentCreated(
                new DocumentCreatedEvent(saved.getId(), saved.getTitle(), saved.getOwner(), Instant.now()));
        return saved;
    }

    @CacheEvict(value = "documents", allEntries = true)
    public void deleteDocument(Long id) {
        repository.deleteById(id);
    }

    @CacheEvict(value = "documents", allEntries = true)
    public Document updateDocument(Long id, Document doc) {
        Document existing = repository.findById(id).orElseThrow();
        existing.setTitle(doc.getTitle());
        if (doc.getOwner() != null) {
            existing.setOwner(doc.getOwner());
        }
        return repository.save(existing);
    }
}

