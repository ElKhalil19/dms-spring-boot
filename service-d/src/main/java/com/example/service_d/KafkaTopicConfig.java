package com.example.service_d;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Value("${app.kafka.topic.documents-uploaded:dms.documents.uploaded}")
    private String topicName;

    @Bean
    public NewTopic documentsUploadedTopic() {
        return TopicBuilder.name(topicName)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
