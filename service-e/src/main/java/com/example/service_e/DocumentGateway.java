package com.example.service_e;

import org.springframework.integration.annotation.MessagingGateway;
import java.util.Map;

@MessagingGateway(defaultRequestChannel = "requestChannel")
public interface DocumentGateway {
    // The Gateway takes the ID and returns the aggregated Map
    Map<String, Object> process(Long id);
}