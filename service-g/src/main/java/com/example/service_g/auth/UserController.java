package com.example.service_g.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserStore userStore;

    public UserController(UserStore userStore) {
        this.userStore = userStore;
    }

    @GetMapping
    public List<UserSummary> listUsers() {
        return userStore.listUsers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserSummary> getUser(@PathVariable Long id) {
        return userStore.getUser(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserSummary createUser(@RequestBody CreateUserRequest request) {
        return userStore.createUser(request);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<UserSummary> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        return userStore.updateUser(id, request)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        return userStore.deleteUser(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}

record CreateUserRequest(
        String name,
        String email,
        String password,
        String role,
        Long departmentId,
        String status
) {}

record UpdateUserRequest(
        String name,
        String email,
        String password,
        String role,
        Long departmentId,
        String status
) {}
