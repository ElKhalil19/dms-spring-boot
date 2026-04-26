package com.example.service_d;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
class DemoApplicationTests {

	@MockitoBean
	KafkaTemplate<String, DocumentUploadedEvent> kafkaTemplate;

	@Test
	void contextLoads() {
	}

}
