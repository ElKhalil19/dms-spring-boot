package com.example.service_d;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/activityLogs")
public class ActivityLogController {

    private final ActivityLogRepository repository;

    public ActivityLogController(ActivityLogRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<ActivityLog> getAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ActivityLog create(@RequestBody ActivityLog log) {
        if (log.getCreatedAt() == null) {
            log.setCreatedAt(Instant.now());
        }
        return repository.save(log);
    }
}
