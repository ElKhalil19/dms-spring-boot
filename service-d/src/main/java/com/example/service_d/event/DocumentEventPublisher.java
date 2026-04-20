package com.example.service_d.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class DocumentEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(DocumentEventPublisher.class);
    private static final String TOPIC = "document-events";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public DocumentEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishDocumentCreated(DocumentCreatedEvent event) {
        kafkaTemplate.send(TOPIC, String.valueOf(event.id()), event);
        log.info("Published DocumentCreatedEvent for document id={}", event.id());
    }
}
