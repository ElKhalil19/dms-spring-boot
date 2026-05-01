package com.example.service_m;

import java.time.Instant;

public record CommentRequest(
        Long documentId,
        Long userId,
        String author,
        String text,
        Instant createdAt
) {}
