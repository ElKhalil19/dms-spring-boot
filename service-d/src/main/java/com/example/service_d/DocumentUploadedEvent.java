package com.example.service_d;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Event published to the dms.documents.uploaded Kafka topic after a document
 * is successfully persisted.
 *
 * <p>Message key: {@code documentId} (String) — ensures all events for the
 * same document land in the same partition, preserving order per document.
 *
 * <p>What is deliberately left out:
 * <ul>
 *   <li>Raw file bytes — far too large for a message; consumers should fetch
 *       the file from the storage layer directly.</li>
 *   <li>ACL / permission data — managed by a dedicated IAM service; including
 *       a snapshot here would go stale and create consistency issues.</li>
 * </ul>
 */
public class DocumentUploadedEvent {

    private String eventId;
    private Instant eventTimestamp;
    private Long documentId;
    private String title;
    private LocalDateTime documentCreatedAt;

    public DocumentUploadedEvent() {}

    public DocumentUploadedEvent(Long documentId, String title, LocalDateTime documentCreatedAt) {
        this.eventId = UUID.randomUUID().toString();
        this.eventTimestamp = Instant.now();
        this.documentId = documentId;
        this.title = title;
        this.documentCreatedAt = documentCreatedAt;
    }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public Instant getEventTimestamp() { return eventTimestamp; }
    public void setEventTimestamp(Instant eventTimestamp) { this.eventTimestamp = eventTimestamp; }

    public Long getDocumentId() { return documentId; }
    public void setDocumentId(Long documentId) { this.documentId = documentId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public LocalDateTime getDocumentCreatedAt() { return documentCreatedAt; }
    public void setDocumentCreatedAt(LocalDateTime documentCreatedAt) { this.documentCreatedAt = documentCreatedAt; }
}
