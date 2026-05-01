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

    public UserStore() {
        users.put(1L, new UserAccount(1L, "Admin User", "admin@dms.com", "admin", null, "active", "admin123"));
        users.put(2L, new UserAccount(2L, "Bob User", "bob@dms.com", "user", null, "active", "user123"));
    }

    public Optional<UserAccount> findByEmailAndPassword(String email, String password) {
        if (email == null || password == null) {
            return Optional.empty();
        }
        return users.values().stream()
                .filter(u -> u.email().equalsIgnoreCase(email) && u.password().equals(password))
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

    public UserSummary createUser(CreateUserRequest request) {
        long id = idSequence.getAndIncrement();
        UserAccount account = new UserAccount(
                id,
                request.name(),
                request.email(),
                request.role(),
                request.departmentId(),
                request.status() == null ? "active" : request.status(),
                request.password());
        users.put(id, account);
        return toSummary(account);
    }

    public Optional<UserSummary> updateUser(Long id, UpdateUserRequest request) {
        return Optional.ofNullable(users.get(id)).map(existing -> {
            UserAccount updated = new UserAccount(
                    existing.id(),
                    request.name() != null ? request.name() : existing.name(),
                    request.email() != null ? request.email() : existing.email(),
                    request.role() != null ? request.role() : existing.role(),
                    request.departmentId() != null ? request.departmentId() : existing.departmentId(),
                    request.status() != null ? request.status() : existing.status(),
                    request.password() != null ? request.password() : existing.password());
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
                account.status());
    }
}
