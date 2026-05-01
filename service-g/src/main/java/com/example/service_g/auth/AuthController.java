package com.example.service_g.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserStore userStore;
    private final JwtService jwtService;

    public AuthController(UserStore userStore, JwtService jwtService) {
        this.userStore = userStore;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        var accountOpt = userStore.findByEmailAndPassword(request.email(), request.password());
        if (accountOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid email or password");
        }

        var account = accountOpt.get();
        UserSummary user = new UserSummary(
                account.id(),
                account.name(),
                account.email(),
                account.role(),
                account.departmentId(),
                account.status());
        String token = jwtService.generateToken(user);
        Instant expiresAt = jwtService.expiryInstant();
        return ResponseEntity.ok(new LoginResponse(token, user, expiresAt.toString()));
    }
}

record LoginRequest(String email, String password) {}

record LoginResponse(String token, UserSummary user, String expiresAt) {}
