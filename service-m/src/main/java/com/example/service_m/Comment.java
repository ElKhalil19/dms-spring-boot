package com.example.service_m;

import org.springframework.data.cassandra.core.mapping.Column;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;

import java.time.Instant;

@Table("comments")
public class Comment {

    @PrimaryKey
    private CommentKey key;

    @Column("text")
    private String text;

    @Column("author")
    private String author;

    @Column("user_id")
    private Long userId;

    @Column("created_at")
    private Instant createdAt;

    @Column("translated_text")
    private String translatedText;

    @Column("source_language")
    private String sourceLanguage;

    @Column("target_language")
    private String targetLanguage;

    public Comment() {}

    public CommentKey getKey() { return key; }
    public void setKey(CommentKey key) { this.key = key; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public String getTranslatedText() { return translatedText; }
    public void setTranslatedText(String translatedText) { this.translatedText = translatedText; }

    public String getSourceLanguage() { return sourceLanguage; }
    public void setSourceLanguage(String sourceLanguage) { this.sourceLanguage = sourceLanguage; }

    public String getTargetLanguage() { return targetLanguage; }
    public void setTargetLanguage(String targetLanguage) { this.targetLanguage = targetLanguage; }
}
