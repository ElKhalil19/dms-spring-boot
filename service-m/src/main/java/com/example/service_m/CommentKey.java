package com.example.service_m;

import org.springframework.data.cassandra.core.cql.Ordering;
import org.springframework.data.cassandra.core.cql.PrimaryKeyType;
import org.springframework.data.cassandra.core.mapping.CassandraType;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyClass;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyColumn;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@PrimaryKeyClass
public class CommentKey implements Serializable {

    @PrimaryKeyColumn(name = "doc_id", ordinal = 0, type = PrimaryKeyType.PARTITIONED)
    private UUID docId;

    @PrimaryKeyColumn(name = "comment_id", ordinal = 1, type = PrimaryKeyType.CLUSTERED, ordering = Ordering.DESCENDING)
    @CassandraType(type = CassandraType.Name.TIMEUUID)
    private UUID commentId;

    public CommentKey() {}

    public CommentKey(UUID docId, UUID commentId) {
        this.docId = docId;
        this.commentId = commentId;
    }

    public UUID getDocId() { return docId; }
    public void setDocId(UUID docId) { this.docId = docId; }

    public UUID getCommentId() { return commentId; }
    public void setCommentId(UUID commentId) { this.commentId = commentId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof CommentKey)) return false;
        CommentKey that = (CommentKey) o;
        return Objects.equals(docId, that.docId) && Objects.equals(commentId, that.commentId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(docId, commentId);
    }
}
