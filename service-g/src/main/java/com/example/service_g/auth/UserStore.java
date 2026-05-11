package com.example.service_g.auth;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class UserStore {

    private final Map<Long, UserAccount> users = new ConcurrentHashMap<>();
    private final AtomicLong idSequence = new AtomicLong(3);
    private final PasswordHasher passwordHasher = new PasswordHasher();

    public UserStore() {
        users.put(1L, createAccount(1L, "Admin User", "admin@dms.com", "admin", null, null, "active", "admin123"));
        users.put(2L, createAccount(2L, "Bob User", "bob@dms.com", "user", null, null, "active", "user123"));
    }

    public Optional<UserAccount> findByEmailAndPassword(String email, String password) {
        if (email == null || password == null) {
            return Optional.empty();
        }
        return users.values().stream()
                .filter(u -> u.email().equalsIgnoreCase(email) && passwordHasher.matches(password, u.passwordSalt(), u.passwordHash()))
                .findFirst();
    }

    public List<UserSummary> listUsers() {
        return users.values().stream()
                .map(this::toSummary)
                .toList();
    }

    public Optional<UserSummary> getUser(Long id) {
        return Optional.ofNullable(users.get(id)).map(this::toSummary);
    }

    public Optional<UserAccount> getAccount(Long id) {
        return Optional.ofNullable(users.get(id));
    }

    public UserSummary createUser(CreateUserRequest request) {
        long id = idSequence.getAndIncrement();
        UserAccount account = createAccount(
                id,
                request.name(),
                request.email(),
                request.role(),
                request.departmentId(),
                request.departmentIds(),
                request.status() == null ? "active" : request.status(),
                request.password());
        users.put(id, account);
        return toSummary(account);
    }

    public Optional<UserSummary> updateUser(Long id, UpdateUserRequest request) {
        return Optional.ofNullable(users.get(id)).map(existing -> {
            String passwordHash = existing.passwordHash();
            String passwordSalt = existing.passwordSalt();
            if (request.password() != null && !request.password().isBlank()) {
                passwordSalt = passwordHasher.generateSalt();
                passwordHash = passwordHasher.hash(request.password(), passwordSalt);
            }
            UserAccount updated = new UserAccount(
                    existing.id(),
                    request.name() != null ? request.name() : existing.name(),
                    request.email() != null ? request.email() : existing.email(),
                    request.role() != null ? request.role() : existing.role(),
                    resolveDepartmentId(request, existing),
                    resolveDepartmentIds(request, existing),
                    request.status() != null ? request.status() : existing.status(),
                    passwordHash,
                    passwordSalt);
            users.put(id, updated);
            return toSummary(updated);
        });
    }

    public boolean deleteUser(Long id) {
        return users.remove(id) != null;
    }

    private UserSummary toSummary(UserAccount account) {
        return new UserSummary(
                account.id(),
                account.name(),
                account.email(),
                account.role(),
                account.departmentId(),
                account.departmentIds(),
                account.status());
    }

    private UserAccount createAccount(Long id,
                                      String name,
                                      String email,
                                      String role,
                                      Long departmentId,
                                      List<Long> departmentIds,
                                      String status,
                                      String rawPassword) {
        String passwordToHash = (rawPassword == null || rawPassword.isBlank()) ? "changeme123" : rawPassword;
        String salt = passwordHasher.generateSalt();
        String hash = passwordHasher.hash(passwordToHash, salt);
        List<Long> normalizedDepartmentIds = normalizeDepartmentIds(departmentIds, departmentId);
        Long normalizedDepartmentId = normalizedDepartmentIds.isEmpty() ? null : normalizedDepartmentIds.get(0);
        return new UserAccount(id, name, email, role, normalizedDepartmentId, normalizedDepartmentIds, status, hash, salt);
    }

    private Long resolveDepartmentId(UpdateUserRequest request, UserAccount existing) {
        if (request.departmentIds() != null) {
            List<Long> ids = normalizeDepartmentIds(request.departmentIds(), request.departmentId());
            return ids.isEmpty() ? null : ids.get(0);
        }
        if (request.departmentId() != null) {
            return request.departmentId();
        }
        return existing.departmentId();
    }

    private List<Long> resolveDepartmentIds(UpdateUserRequest request, UserAccount existing) {
        if (request.departmentIds() != null) {
            return normalizeDepartmentIds(request.departmentIds(), request.departmentId());
        }
        if (request.departmentId() != null) {
            return normalizeDepartmentIds(null, request.departmentId());
        }
        return existing.departmentIds();
    }

    private List<Long> normalizeDepartmentIds(List<Long> departmentIds, Long departmentId) {
        List<Long> result = new ArrayList<>();
        if (departmentIds != null) {
            for (Long id : departmentIds) {
                if (id != null && !result.contains(id)) {
                    result.add(id);
                }
            }
        }
        if (departmentId != null && !result.contains(departmentId)) {
            result.add(0, departmentId);
        }
        return result;
    }
}
