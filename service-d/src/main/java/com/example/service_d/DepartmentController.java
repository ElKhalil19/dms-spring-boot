package com.example.service_d;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {
    private final DepartmentRepository repo;
    public DepartmentController(DepartmentRepository repo) { this.repo = repo; }
    @GetMapping
    public List<Department> getAll() { return repo.findAll(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Department create(@RequestBody Department department) {
        return repo.save(department);
    }

    @PatchMapping("/{id}")
    public Department update(@PathVariable Long id, @RequestBody Department payload) {
        Department existing = repo.findById(id).orElseThrow();
        if (payload.getName() != null) {
            existing.setName(payload.getName());
        }
        return repo.save(existing);
    }
}
