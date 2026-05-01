package com.example.service_g.auth;

public record UserSummary(
        Long id,
        String name,
        String email,
        String role,
        Long departmentId,
        String status
) {}
