package com.example.service_m;

import org.springframework.data.cassandra.repository.CassandraRepository;

import java.util.List;
import java.util.UUID;

public interface CommentRepository extends CassandraRepository<Comment, CommentKey> {
    List<Comment> findByKeyDocId(UUID docId);
}