package com.knowbuddy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.cassandra.CassandraAutoConfiguration;
import org.springframework.boot.autoconfigure.data.cassandra.CassandraDataAutoConfiguration;
import org.springframework.boot.actuate.autoconfigure.cassandra.CassandraHealthContributorAutoConfiguration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * FIX: Exclude all Cassandra auto-configurations.
 *
 * The langchain4j-cassandra dependency pulls in Spring's CassandraAutoConfiguration
 * which tries to connect to a LOCAL Cassandra at 127.0.0.1:9042 on startup.
 * We are using AstraDB (cloud) — the connection is managed entirely by
 * AstraDbEmbeddingStore in AstraDBConfig.java, NOT by Spring's Cassandra support.
 * Excluding these prevents the unwanted local connection attempt.
 */
@SpringBootApplication(exclude = {
        CassandraAutoConfiguration.class,
        CassandraDataAutoConfiguration.class,
        CassandraHealthContributorAutoConfiguration.class
})
@EnableAsync
public class KnowBuddyApplication {

    public static void main(String[] args) {
        SpringApplication.run(KnowBuddyApplication.class, args);
    }
}