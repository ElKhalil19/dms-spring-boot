package com.example.service_m;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(properties = {
		"spring.autoconfigure.exclude=" +
		"org.springframework.boot.cassandra.autoconfigure.CassandraAutoConfiguration," +
		"org.springframework.boot.data.cassandra.autoconfigure.DataCassandraAutoConfiguration," +
		"org.springframework.boot.data.cassandra.autoconfigure.DataCassandraRepositoriesAutoConfiguration"
})
class DemoApplicationTests {

	@MockitoBean
	CommentRepository commentRepository;

	@Test
	void contextLoads() {
	}

}
