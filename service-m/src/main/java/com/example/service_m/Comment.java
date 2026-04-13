package com.example.service_m;

import jakarta.persistence.*;

@Entity
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String text;
    private Long docId; // This links the comment to the document ID from Service D

    public Comment() {}

    // Getters and Setters
    public Long getId() { return id; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public Long getDocId() { return docId; }
    public void setDocId(Long docId) { this.docId = docId; }
}