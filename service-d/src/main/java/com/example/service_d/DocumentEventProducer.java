package com.example.service_d;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class DocumentEventProducer {

    private static final Logger log = LoggerFactory.getLogger(DocumentEventProducer.class);

    private final KafkaTemplate<String, DocumentUploadedEvent> kafkaTemplate;
    private final String topic;

    public DocumentEventProducer(
            KafkaTemplate<String, DocumentUploadedEvent> kafkaTemplate,
            @Value("${app.kafka.topic.documents-uploaded:dms.documents.uploaded}") String topic) {
        this.kafkaTemplate = kafkaTemplate;
        this.topic = topic;
    }

    public void publishDocumentUploaded(DocumentUploadedEvent event) {
        String key = String.valueOf(event.getDocumentId());
        kafkaTemplate.send(topic, key, event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish DocumentUploadedEvent for documentId={}", event.getDocumentId(), ex);
                    } else {
                        log.info("Published DocumentUploadedEvent eventId={} documentId={} partition={} offset={}",
                                event.getEventId(), event.getDocumentId(),
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    }
                });
    }
}
