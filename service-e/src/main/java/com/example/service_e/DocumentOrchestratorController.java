package com.example.service_e;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
public class DocumentOrchestratorController {

    @Autowired
    private DocumentGateway gateway;

    @GetMapping("/document/{id}")
    public Map<String, Object> getFullDocument(@PathVariable Long id) {
        // Send the ID into the integration flow
        return gateway.process(id);
    }
}