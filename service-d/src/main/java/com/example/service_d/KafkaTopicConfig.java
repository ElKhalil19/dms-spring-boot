package com.example.service_d;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Value("${app.kafka.topic.documents-created:dms.documents.created}")
    private String documentsCreatedTopicName;

    @Value("${app.kafka.topic.translation-results:dms.translations.completed}")
    private String translationResultsTopicName;

    @Bean
    public NewTopic documentsCreatedTopic() {
        return TopicBuilder.name(documentsCreatedTopicName)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic translationResultsTopic() {
        return TopicBuilder.name(translationResultsTopicName)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
