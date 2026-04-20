package com.example.service_d;

import com.example.service_d.event.DocumentEventPublisher;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
class DemoApplicationTests {

	@MockitoBean
	DocumentEventPublisher documentEventPublisher;

	@Test
	void contextLoads() {
	}

}
