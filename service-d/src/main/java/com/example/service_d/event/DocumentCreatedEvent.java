package com.example.service_d.event;

import java.time.Instant;

public record DocumentCreatedEvent(Long id, String title, String owner, Instant timestamp) {}
