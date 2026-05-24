package com.edu.classrepo.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

@Configuration
public class JacksonConfig {

    @Bean
    public Hibernate6Module hibernate6Module() {
        Hibernate6Module module = new Hibernate6Module();
        // OSIV is enabled, so lazy-loading during Jackson serialization is safe.
        // FORCE_LAZY_LOADING=true lets Jackson trigger proxy init; batch_fetch_size=20
        // in application.yml keeps the N+1 cost manageable.
        module.configure(Hibernate6Module.Feature.FORCE_LAZY_LOADING, true);
        return module;
    }
}
