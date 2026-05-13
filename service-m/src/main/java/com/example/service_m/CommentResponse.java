package com.example.service_m;

import java.time.Instant;

public record CommentResponse(
        String id,
        Long documentId,
        Long userId,
        String author,
        String text,
        String translatedText,
        String sourceLanguage,
        String targetLanguage,
        Instant createdAt
) {}
