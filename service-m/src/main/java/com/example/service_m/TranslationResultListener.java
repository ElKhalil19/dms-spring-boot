package com.example.service_m;

import java.util.UUID;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class TranslationResultListener {

    private final CommentRepository repository;

    public TranslationResultListener(CommentRepository repository) {
        this.repository = repository;
    }

    @KafkaListener(topics = "${app.kafka.topic.translation-results:dms.translations.completed}", groupId = "comments-service-translation-consumers", containerFactory = "translationKafkaListenerContainerFactory")
    public void onTranslationResult(TranslationResultEvent event) {
        if (event == null || event.getEntityType() == null || !"COMMENT".equalsIgnoreCase(event.getEntityType())) {
            return;
        }
        if (event.getDocumentId() == null || event.getEntityId() == null) {
            return;
        }
        CommentKey key = new CommentKey();
        key.setDocId(event.getDocumentId());
        try {
            key.setCommentId(UUID.fromString(event.getEntityId()));
        } catch (IllegalArgumentException ex) {
            return;
        }
        repository.findById(key).ifPresent(comment -> {
            comment.setTranslatedText(event.getTranslatedText());
            comment.setSourceLanguage(event.getSourceLanguage());
            comment.setTargetLanguage(event.getTargetLanguage());
            repository.save(comment);
        });
    }
}
