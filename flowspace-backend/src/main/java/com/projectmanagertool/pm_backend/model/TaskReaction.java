package com.projectmanagertool.pm_backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.LocalDateTime;

@Entity
@Table(name = "task_reactions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"task_id","username","emoji"}))
@Data @NoArgsConstructor @AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class TaskReaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false, length = 10)
    private String emoji;  // "👍", "🔥", "✅", "❤️", "😮"

    @CreatedDate @Column(updatable = false)
    private LocalDateTime createdAt;
}
