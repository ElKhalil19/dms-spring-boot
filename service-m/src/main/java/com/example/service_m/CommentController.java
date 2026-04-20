package com.example.service_m;

import com.datastax.oss.driver.api.core.uuid.Uuids;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class CommentController {

    private final CommentRepository repository;

    public CommentController(CommentRepository repository) {
        this.repository = repository;
    }

    /** Legacy endpoint kept for backwards compatibility */
    @PostMapping("/comments/add")
    public Comment add(@RequestBody Comment comment) {
        return saveComment(comment);
    }

    /** Legacy endpoint kept for backwards compatibility */
    @GetMapping("/comments/list/{docId}")
    public List<Comment> list(@PathVariable UUID docId) {
        return repository.findByKeyDocId(docId);
    }

    /** Standard REST endpoint: POST /documents/{docId}/comments */
    @PostMapping("/documents/{docId}/comments")
    public Comment addForDocument(@PathVariable UUID docId, @RequestBody Comment comment) {
        if (comment.getKey() == null) {
            comment.setKey(new CommentKey());
        }
        comment.getKey().setDocId(docId);
        return saveComment(comment);
    }

    /** Standard REST endpoint: GET /documents/{docId}/comments */
    @GetMapping("/documents/{docId}/comments")
    public List<Comment> listForDocument(@PathVariable UUID docId) {
        return repository.findByKeyDocId(docId);
    }

    private Comment saveComment(Comment comment) {
        if (comment.getKey() == null) {
            comment.setKey(new CommentKey());
        }
        comment.getKey().setCommentId(Uuids.timeBased());
        return repository.save(comment);
    }
}