package com.example.service_m;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    // Spring creates this query automatically based on the method name
    List<Comment> findByDocId(Long docId);
}