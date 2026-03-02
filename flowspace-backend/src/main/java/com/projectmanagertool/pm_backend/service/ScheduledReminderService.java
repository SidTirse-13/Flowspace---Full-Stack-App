package com.projectmanagertool.pm_backend.service;

import com.projectmanagertool.pm_backend.model.Task;
import com.projectmanagertool.pm_backend.model.User;
import com.projectmanagertool.pm_backend.repository.TaskRepository;
import com.projectmanagertool.pm_backend.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ScheduledReminderService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final EmailService   emailService;

    public ScheduledReminderService(TaskRepository taskRepository,
                                    UserRepository userRepository,
                                    EmailService emailService) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.emailService   = emailService;
    }

    // Overdue check — every day at 9:00 AM
    @Scheduled(cron = "0 0 9 * * *")
    public void sendOverdueReminders() {
        LocalDate today = LocalDate.now();
        List<Task> overdue = taskRepository.findOverdueTasks(today);
        for (Task t : overdue) {
            User u = userRepository.findByUsername(t.getAssignedTo()).orElse(null);
            if (u != null && u.getEmail() != null)
                emailService.sendOverdueReminder(u.getEmail(), u.getUsername(),
                        t.getTitle(), t.getProject().getName(), t.getEndDate().toString());
        }
        System.out.println("⏰ [Scheduler] Sent " + overdue.size() + " overdue reminder(s).");
    }

    // Due tomorrow — every day at 8:00 AM
    @Scheduled(cron = "0 0 8 * * *")
    public void sendDeadlineReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<Task> dueTomorrow = taskRepository.findTasksDueOn(tomorrow);
        for (Task t : dueTomorrow) {
            User u = userRepository.findByUsername(t.getAssignedTo()).orElse(null);
            if (u != null && u.getEmail() != null)
                emailService.sendDeadlineReminder(u.getEmail(), u.getUsername(),
                        t.getTitle(), t.getProject().getName(), t.getEndDate().toString());
        }
        System.out.println("📅 [Scheduler] Sent " + dueTomorrow.size() + " deadline reminder(s).");
    }

    // Weekly digest — every Monday at 7:00 AM
    @Scheduled(cron = "0 0 7 * * MON")
    public void sendWeeklyDigest() {
        LocalDate today    = LocalDate.now();
        LocalDate weekEnd  = today.plusDays(7);
        List<Task> allTasks = taskRepository.findAll().stream()
                .filter(t -> t.getAssignedTo() != null && !t.getStatus().name().equals("DONE"))
                .toList();

        Map<String, List<Task>> byUser = allTasks.stream()
                .collect(Collectors.groupingBy(Task::getAssignedTo));

        for (Map.Entry<String, List<Task>> entry : byUser.entrySet()) {
            User u = userRepository.findByUsername(entry.getKey()).orElse(null);
            if (u == null || u.getEmail() == null) continue;

            List<Task> userTasks = entry.getValue();
            int overdue  = (int) userTasks.stream().filter(t ->
                    t.getEndDate() != null && t.getEndDate().isBefore(today)).count();
            int dueSoon  = (int) userTasks.stream().filter(t ->
                    t.getEndDate() != null &&
                            !t.getEndDate().isBefore(today) &&
                            !t.getEndDate().isAfter(weekEnd)).count();
            int total = userTasks.size();

            emailService.sendWeeklyDigest(u.getEmail(), u.getUsername(), dueSoon, overdue, total);
        }
        System.out.println("📧 [Scheduler] Sent weekly digest to " + byUser.size() + " user(s).");
    }
}
