package com.projectmanagertool.pm_backend.repository;

import com.projectmanagertool.pm_backend.model.Task;
import com.projectmanagertool.pm_backend.model.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByProjectId(Long projectId);

    List<Task> findByAssignedTo(String assignedTo);

    // ── Subtasks ──────────────────────────────────────────────────
    List<Task> findByParentTask_Id(Long parentTaskId);  // ← correct Spring Data naming

    // ── Count methods for project summary ────────────────────────
    long countByProjectId(Long projectId);

    long countByProjectIdAndStatus(Long projectId, TaskStatus status);

    // ── Overdue tasks ─────────────────────────────────────────────
    @Query("SELECT t FROM Task t WHERE t.assignedTo IS NOT NULL " +
            "AND t.status <> :doneStatus " +
            "AND t.endDate IS NOT NULL " +
            "AND t.endDate < :today")
    List<Task> findOverdueTasks(@Param("today") LocalDate today,
                                @Param("doneStatus") TaskStatus doneStatus);

    default List<Task> findOverdueTasks(LocalDate today) {
        return findOverdueTasks(today, TaskStatus.DONE);
    }

    // ── Tasks due on a specific date ──────────────────────────────
    @Query("SELECT t FROM Task t WHERE t.assignedTo IS NOT NULL " +
            "AND t.status <> :doneStatus " +
            "AND t.endDate = :date")
    List<Task> findTasksDueOn(@Param("date") LocalDate date,
                              @Param("doneStatus") TaskStatus doneStatus);

    default List<Task> findTasksDueOn(LocalDate date) {
        return findTasksDueOn(date, TaskStatus.DONE);
    }
}