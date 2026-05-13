package com.example.service_d;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;

import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentEventProducerTest {

    @Mock
    private KafkaTemplate<String, DocumentUploadedEvent> kafkaTemplate;

    private DocumentEventProducer producer;

    private static final String TOPIC = "dms.documents.created";

    @BeforeEach
    void setUp() {
        producer = new DocumentEventProducer(kafkaTemplate, TOPIC);
    }

    @Test
    void publishDocumentUploaded_sendsEventWithDocumentIdAsKey() {
        DocumentUploadedEvent event = new DocumentUploadedEvent(42L, "Test Doc", "en", LocalDateTime.now());

        CompletableFuture<SendResult<String, DocumentUploadedEvent>> future = new CompletableFuture<>();
        when(kafkaTemplate.send(eq(TOPIC), eq("42"), eq(event))).thenReturn(future);

        producer.publishDocumentUploaded(event);

        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        verify(kafkaTemplate).send(eq(TOPIC), keyCaptor.capture(), eq(event));
        assertThat(keyCaptor.getValue()).isEqualTo("42");
    }

    @Test
    void publishDocumentUploaded_usesConfiguredTopic() {
        DocumentUploadedEvent event = new DocumentUploadedEvent(1L, "Doc", "en", LocalDateTime.now());

        CompletableFuture<SendResult<String, DocumentUploadedEvent>> future = new CompletableFuture<>();
        when(kafkaTemplate.send(eq(TOPIC), anyString(), eq(event))).thenReturn(future);

        producer.publishDocumentUploaded(event);

        verify(kafkaTemplate).send(eq(TOPIC), anyString(), eq(event));
    }
}
