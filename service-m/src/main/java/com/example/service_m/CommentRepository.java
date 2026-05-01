package com.example.service_m;

import org.springframework.data.cassandra.repository.CassandraRepository;

import java.util.List;

public interface CommentRepository extends CassandraRepository<Comment, CommentKey> {
    List<Comment> findByKeyDocId(Long docId);
}
