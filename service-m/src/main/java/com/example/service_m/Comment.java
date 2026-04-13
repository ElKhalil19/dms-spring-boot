package com.example.service_m;

import org.springframework.data.cassandra.core.mapping.Column;
import org.springframework.data.cassandra.core.mapping.PrimaryKey;
import org.springframework.data.cassandra.core.mapping.Table;

@Table("comments")
public class Comment {

    @PrimaryKey
    private CommentKey key;

    @Column("content")
    private String content;

    @Column("author")
    private String author;

    public Comment() {}

    public CommentKey getKey() { return key; }
    public void setKey(CommentKey key) { this.key = key; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
}