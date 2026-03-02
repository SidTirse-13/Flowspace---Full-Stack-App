package com.projectmanagertool.pm_backend.service;

import com.projectmanagertool.pm_backend.dto.TaskReactionDTO;
import com.projectmanagertool.pm_backend.model.Task;
import com.projectmanagertool.pm_backend.model.TaskReaction;
import com.projectmanagertool.pm_backend.repository.TaskReactionRepository;
import com.projectmanagertool.pm_backend.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class TaskReactionService {

    private static final List<String> ALLOWED = List.of("👍","🔥","✅","❤️","😮");

    private final TaskReactionRepository reactionRepo;
    private final TaskRepository taskRepo;

    public TaskReactionService(TaskReactionRepository reactionRepo, TaskRepository taskRepo) {
        this.reactionRepo = reactionRepo;
        this.taskRepo = taskRepo;
    }

    public TaskReactionDTO getReactions(Long taskId, String username) {
        List<Object[]> counts = reactionRepo.countByTaskIdGroupByEmoji(taskId);
        Map<String,Long> countMap = new LinkedHashMap<>();
        for (Object[] row : counts) countMap.put((String)row[0], (Long)row[1]);

        Map<String,Boolean> mine = new LinkedHashMap<>();
        for (String emoji : ALLOWED) {
            mine.put(emoji, reactionRepo.findByTaskIdAndUsernameAndEmoji(taskId,username,emoji).isPresent());
        }
        return TaskReactionDTO.builder().taskId(taskId).counts(countMap).mine(mine).build();
    }

    @Transactional
    public TaskReactionDTO toggle(Long taskId, String emoji, String username) {
        if (!ALLOWED.contains(emoji)) throw new RuntimeException("Invalid emoji");
        Task task = taskRepo.findById(taskId).orElseThrow(() -> new RuntimeException("Task not found"));
        var existing = reactionRepo.findByTaskIdAndUsernameAndEmoji(taskId, username, emoji);
        if (existing.isPresent()) {
            reactionRepo.delete(existing.get());
        } else {
            TaskReaction r = new TaskReaction();
            r.setTask(task); r.setUsername(username); r.setEmoji(emoji);
            reactionRepo.save(r);
        }
        return getReactions(taskId, username);
    }
}
