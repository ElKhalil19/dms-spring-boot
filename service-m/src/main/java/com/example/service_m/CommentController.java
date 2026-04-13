package com.example.service_m;

import com.datastax.oss.driver.api.core.uuid.Uuids;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/comments")
public class CommentController {

    private final CommentRepository repository;

    public CommentController(CommentRepository repository) {
        this.repository = repository;
    }

    @PostMapping("/add")
    public Comment add(@RequestBody Comment comment) {
        if (comment.getKey() == null) {
            comment.setKey(new CommentKey());
        }
        // Auto-generate a time-based UUID (TIMEUUID) so comments are ordered by insertion time
        comment.getKey().setCommentId(Uuids.timeBased());
        return repository.save(comment);
    }

    @GetMapping("/list/{docId}")
    public List<Comment> list(@PathVariable UUID docId) {
        return repository.findByKeyDocId(docId);
    }
}