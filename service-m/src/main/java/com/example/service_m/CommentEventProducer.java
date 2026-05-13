package com.example.service_m;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class CommentEventProducer {

    private static final Logger log = LoggerFactory.getLogger(CommentEventProducer.class);

    private final KafkaTemplate<String, CommentCreatedEvent> kafkaTemplate;
    private final String topic;

    public CommentEventProducer(
            KafkaTemplate<String, CommentCreatedEvent> kafkaTemplate,
            @Value("${app.kafka.topic.comments-created:dms.comments.created}") String topic) {
        this.kafkaTemplate = kafkaTemplate;
        this.topic = topic;
    }

    public void publishCommentCreated(CommentCreatedEvent event) {
        kafkaTemplate.send(topic, event.getCommentId(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish CommentCreatedEvent for commentId={}", event.getCommentId(), ex);
                    }
                });
    }
}
