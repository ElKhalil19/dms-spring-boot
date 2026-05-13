package com.example.service_m;

import java.time.Instant;
import java.util.UUID;

public class CommentCreatedEvent {
    private String eventId;
    private Instant eventTimestamp;
    private String commentId;
    private Long documentId;
    private String text;
    private String sourceLanguage;

    public static CommentCreatedEvent from(Comment comment) {
        CommentCreatedEvent event = new CommentCreatedEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setEventTimestamp(Instant.now());
        event.setCommentId(comment.getKey().getCommentId().toString());
        event.setDocumentId(comment.getKey().getDocId());
        event.setText(comment.getText());
        event.setSourceLanguage(comment.getSourceLanguage());
        return event;
    }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public Instant getEventTimestamp() { return eventTimestamp; }
    public void setEventTimestamp(Instant eventTimestamp) { this.eventTimestamp = eventTimestamp; }
    public String getCommentId() { return commentId; }
    public void setCommentId(String commentId) { this.commentId = commentId; }
    public Long getDocumentId() { return documentId; }
    public void setDocumentId(Long documentId) { this.documentId = documentId; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getSourceLanguage() { return sourceLanguage; }
    public void setSourceLanguage(String sourceLanguage) { this.sourceLanguage = sourceLanguage; }
}
