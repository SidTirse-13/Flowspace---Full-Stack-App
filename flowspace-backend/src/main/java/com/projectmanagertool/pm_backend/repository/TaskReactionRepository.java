package com.projectmanagertool.pm_backend.repository;
import com.projectmanagertool.pm_backend.model.TaskReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface TaskReactionRepository extends JpaRepository<TaskReaction, Long> {
    List<TaskReaction> findByTaskId(Long taskId);
    Optional<TaskReaction> findByTaskIdAndUsernameAndEmoji(Long taskId, String username, String emoji);
    void deleteByTaskIdAndUsernameAndEmoji(Long taskId, String username, String emoji);
    @Query("SELECT r.emoji, COUNT(r) FROM TaskReaction r WHERE r.task.id = :taskId GROUP BY r.emoji")
    List<Object[]> countByTaskIdGroupByEmoji(Long taskId);
}
