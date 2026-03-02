package com.projectmanagertool.pm_backend.repository;
import com.projectmanagertool.pm_backend.model.TimeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface TimeLogRepository extends JpaRepository<TimeLog, Long> {
    List<TimeLog> findByTaskIdOrderByLogDateDesc(Long taskId);
    List<TimeLog> findByUsernameOrderByLogDateDesc(String username);

    @Query("SELECT SUM(t.hours) FROM TimeLog t WHERE t.task.id = :taskId")
    Double sumHoursByTaskId(Long taskId);

    @Query("SELECT SUM(t.hours) FROM TimeLog t WHERE t.task.project.id = :projectId")
    Double sumHoursByProjectId(Long projectId);

    @Query("SELECT t.username, SUM(t.hours) FROM TimeLog t WHERE t.task.project.id = :projectId GROUP BY t.username")
    List<Object[]> sumHoursByUserForProject(Long projectId);
}
