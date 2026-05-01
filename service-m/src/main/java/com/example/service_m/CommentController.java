package com.example.service_m;

import com.datastax.oss.driver.api.core.uuid.Uuids;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/comments")
public class CommentController {

    private final CommentRepository repository;

    public CommentController(CommentRepository repository) {
        this.repository = repository;
    }

    @PostMapping("/add")
    public CommentResponse addLegacy(@RequestBody CommentRequest comment) {
        return add(comment);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse add(@RequestBody CommentRequest comment) {
        Comment saved = saveComment(comment);
        return toResponse(saved);
    }

    @GetMapping("/list/{docId}")
    public List<CommentResponse> listLegacy(@PathVariable Long docId) {
        return list(docId);
    }

    @GetMapping
    public List<CommentResponse> list(@RequestParam("documentId") Long docId) {
        return repository.findByKeyDocId(docId).stream()
                .map(this::toResponse)
                .toList();
    }

    private Comment saveComment(CommentRequest request) {
        Comment comment = new Comment();
        CommentKey key = new CommentKey();
        key.setDocId(request.documentId());
        key.setCommentId(Uuids.timeBased());
        comment.setKey(key);
        comment.setAuthor(request.author());
        comment.setUserId(request.userId());
        comment.setText(request.text());
        comment.setCreatedAt(request.createdAt() != null ? request.createdAt() : Instant.now());
        return repository.save(comment);
    }

    private CommentResponse toResponse(Comment comment) {
        return new CommentResponse(
                comment.getKey().getCommentId().toString(),
                comment.getKey().getDocId(),
                comment.getUserId(),
                comment.getAuthor(),
                comment.getText(),
                comment.getCreatedAt());
    }
}
