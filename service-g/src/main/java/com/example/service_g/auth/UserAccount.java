package com.example.service_g.auth;

import java.util.List;

public record UserAccount(
        Long id,
        String name,
        String email,
        String role,
        Long departmentId,
        List<Long> departmentIds,
        String status,
        String passwordHash,
        String passwordSalt
) {}
