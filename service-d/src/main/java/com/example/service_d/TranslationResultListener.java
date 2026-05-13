package com.example.service_d;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class TranslationResultListener {

    private final DocumentRepository repository;

    public TranslationResultListener(DocumentRepository repository) {
        this.repository = repository;
    }

    @KafkaListener(topics = "${app.kafka.topic.translation-results:dms.translations.completed}", groupId = "documents-service-translation-consumers", containerFactory = "translationKafkaListenerContainerFactory")
    @Transactional
    public void onTranslationResult(TranslationResultEvent event) {
        if (event == null || event.getEntityType() == null || !"DOCUMENT".equalsIgnoreCase(event.getEntityType())) {
            return;
        }
        Long documentId = event.getDocumentId();
        if (documentId == null && event.getEntityId() != null) {
            try {
                documentId = Long.parseLong(event.getEntityId());
            } catch (NumberFormatException ignored) {
                return;
            }
        }
        if (documentId == null) {
            return;
        }
        repository.findById(documentId).ifPresent(doc -> {
            doc.setTranslatedTitle(event.getTranslatedText());
            doc.setSourceLanguage(event.getSourceLanguage());
            doc.setTargetLanguage(event.getTargetLanguage());
            repository.save(doc);
        });
    }
}
