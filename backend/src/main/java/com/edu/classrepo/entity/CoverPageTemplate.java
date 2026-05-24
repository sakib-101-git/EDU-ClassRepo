package com.edu.classrepo.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "cover_page_templates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CoverPageTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Type type;

    @Column(nullable = false, length = 100)
    private String name;

    /** JSON array of field definitions: [{name, label, type, required, geminiPrompt}] */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "field_schema", columnDefinition = "jsonb")
    private String fieldSchema;

    /** JSON object for layout config (margins, logo position, font sizes, etc.) */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "layout_config", columnDefinition = "jsonb")
    private String layoutConfig;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public enum Type { ASSIGNMENT, LAB_REPORT, PROJECT, THESIS }
}
