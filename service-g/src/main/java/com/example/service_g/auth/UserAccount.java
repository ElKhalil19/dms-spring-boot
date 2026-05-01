package com.example.service_g.auth;

public record UserAccount(
        Long id,
        String name,
        String email,
        String role,
        Long departmentId,
        String status,
        String passwordHash,
        String passwordSalt
) {}
