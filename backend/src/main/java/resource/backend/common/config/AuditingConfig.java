package resource.backend.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.auditing.DateTimeProvider;

import java.time.OffsetDateTime;
import java.util.Optional;

@Configuration
public class AuditingConfig {

    @Bean(name = "dateTimeProvider")
    public DateTimeProvider dateTimeProvider() {
        // Changed "=>" to "->" to match correct Java lambda syntax
        return () -> Optional.of(OffsetDateTime.now());
    }
}