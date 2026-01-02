package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Async Configuration for non-blocking operations
 * 
 * DEADLOCK FIX: This executor allows heavy I/O operations (like SMS sending)
 * to run in separate thread pool, preventing Kafka listener threads from blocking.
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * Executor for notification tasks (SMS sending, etc.)
     * Prevents blocking Kafka consumer threads
     */
    @Bean(name = "notificationExecutor")
    public Executor notificationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        // Core threads always ready
        executor.setCorePoolSize(5);
        // Max threads for burst load
        executor.setMaxPoolSize(20);
        // Queue for pending tasks
        executor.setQueueCapacity(200);
        // Thread naming for debugging
        executor.setThreadNamePrefix("notification-");
        // Wait for tasks on shutdown
        executor.setWaitForTasksToCompleteOnShutdown(true);
        // Max wait time on shutdown
        executor.setAwaitTerminationSeconds(30);
        // Reject policy: throw exception if queue full
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }

    /**
     * Executor for database operations
     * Prevents blocking Kafka threads on database operations
     */
    @Bean(name = "databaseExecutor")
    public Executor databaseExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(3);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("database-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }
}
