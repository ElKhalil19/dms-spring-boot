package com.example.service_m;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/comments")
public class CommentController {

    private final CommentRepository repository;

    public CommentController(CommentRepository repository) {
        this.repository = repository;
    }

    @PostMapping("/add")
    public Comment add(@RequestBody Comment comment) {
        return repository.save(comment);
    }

    @GetMapping("/list/{docId}")
    public List<Comment> list(@PathVariable Long docId) {
        return repository.findByDocId(docId);
    }
}