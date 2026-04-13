package com.example.service_e;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.dsl.IntegrationFlow;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;
import java.util.ArrayList;

@Configuration
public class OrchestrationFlow {

    @Bean
    public RestTemplate restTemplate() { 
        return new RestTemplate(); 
    }

    @Bean
    public IntegrationFlow documentFlow(RestTemplate restTemplate) {
        return IntegrationFlow.from("requestChannel")
            // Use <Long> to tell Spring the payload is the ID
            .<Long>handle((id, headers) -> {
                Map<String, Object> response = new HashMap<>();
                
                // 1. Fetch Document from Service D (Port 8081)
                try {
                    Object doc = restTemplate.getForObject("http://localhost:8081/documents/get/" + id, Object.class);
                    response.put("document", doc);
                } catch (Exception e) {
                    response.put("document", "Document Service Unavailable");
                }

                // 2. Fetch Comments from Service M (Port 8083)
                try {
                    Object comments = restTemplate.getForObject("http://localhost:8083/comments/list/" + id, Object.class);
                    response.put("comments", comments);
                } catch (Exception e) {
                    // Availability Priority: Fallback to empty list if service M is down
                    response.put("comments", new ArrayList<>());
                }

                return response; // This becomes the return value of the Gateway process() method
            })
            .get();
    }
}