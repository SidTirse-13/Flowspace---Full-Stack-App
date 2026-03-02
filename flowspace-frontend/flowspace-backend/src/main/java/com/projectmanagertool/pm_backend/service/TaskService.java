package com.projectmanagertool.pm_backend.service;

import com.projectmanagertool.pm_backend.dto.*;
import com.projectmanagertool.pm_backend.exception.ProjectNotFoundException;
import com.projectmanagertool.pm_backend.exception.UnauthorizedException;
import com.projectmanagertool.pm_backend.model.Project;
import com.projectmanagertool.pm_backend.model.Task;
import com.projectmanagertool.pm_backend.model.TaskStatus;
import com.projectmanagertool.pm_backend.repository.ProjectRepository;
import com.projectmanagertool.pm_backend.repository.TaskRepository;
import com.projectmanagertool.pm_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.context.annotation.Lazy;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public TaskService(TaskRepository taskRepository,
                       ProjectRepository projectRepository,
                       UserRepository userRepository,
                       @Lazy AuditService auditService,
                       @Lazy NotificationService notificationService) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    private int calculateProgress(Task task) {
        switch (task.getStatus()) {
            case TODO:        return 0;
            case IN_PROGRESS: return 50;
            case DONE:        return 100;
            default:          return 0;
        }
    }

    // =========================
    // CREATE TASK
    // =========================
    public Task createTask(Long projectId, TaskRequest request, String username) {

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getOwnerUsername().equals(username)) {
            throw new RuntimeException("Unauthorized");
        }

        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription() != null && !request.getDescription().isBlank()
                ? request.getDescription() : null);
        task.setStatus(request.getStatus());
        task.setStartDate(request.getStartDate());
        task.setEndDate(request.getEndDate());
        task.setProject(project);

        // Priority — default MEDIUM if not set
        String priority = request.getPriority();
        task.setPriority(priority != null && List.of("LOW","MEDIUM","HIGH","URGENT").contains(priority)
                ? priority : "MEDIUM");

        if (request.getDependsOnTaskId() != null) {
            Task dependency = taskRepository.findById(request.getDependsOnTaskId())
                    .orElseThrow(() -> new RuntimeException("Dependency task not found"));
            if (!dependency.getProject().getId().equals(projectId)) {
                throw new RuntimeException("Dependency must belong to same project");
            }
            task.setDependsOn(dependency);
        }

        // Subtask support — assign parent if provided
        if (request.getParentTaskId() != null) {
            Task parent = taskRepository.findById(request.getParentTaskId())
                    .orElseThrow(() -> new RuntimeException("Parent task not found"));
            if (!parent.getProject().getId().equals(projectId)) {
                throw new RuntimeException("Parent task must belong to same project");
            }
            task.setParentTask(parent);
        }

        Task saved = taskRepository.save(task);
        auditService.logTaskCreate(saved.getId(), saved.getTitle(), username);
        return saved;
    }

    // =========================
    // GET TASKS BY PROJECT
    // =========================
    public List<TaskResponse> getProjectTasks(Long projectId, String username) {

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));

        boolean isOwner = project.getOwnerUsername().equals(username);

        if (!isOwner) {
            boolean hasAssignedTask = taskRepository.findByProjectId(projectId)
                    .stream().anyMatch(t -> username.equals(t.getAssignedTo()));
            if (!hasAssignedTask) {
                throw new UnauthorizedException("Access denied to this project");
            }
        }

        List<Task> tasks = taskRepository.findByProjectId(projectId);

        if (!isOwner) {
            return tasks.stream()
                    .filter(task -> username.equals(task.getAssignedTo()))
                    .map(task -> mapToResponse(task, 0L))
                    .toList();
        }

        List<TaskSlackDTO> slackList = calculateSlack(projectId, username);
        Map<Long, Long> slackMap = new HashMap<>();
        for (TaskSlackDTO s : slackList) {
            slackMap.put(s.getTaskId(), s.getSlackDays());
        }

        return tasks.stream()
                .map(task -> mapToResponse(task, slackMap.getOrDefault(task.getId(), 0L)))
                .toList();
    }

    // =========================
    // UPDATE TASK STATUS
    // =========================
    public Task updateTaskStatus(Long taskId, TaskStatus newStatus, String username) {

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        boolean isOwner    = task.getProject().getOwnerUsername().equals(username);
        boolean isAssignee = username.equals(task.getAssignedTo());

        if (!isOwner && !isAssignee) {
            throw new RuntimeException("Only the project owner or assigned user can update task status");
        }

        if (newStatus == TaskStatus.DONE &&
                task.getDependsOn() != null &&
                task.getDependsOn().getStatus() != TaskStatus.DONE) {
            throw new RuntimeException("Cannot complete task before dependency is DONE");
        }

        // FIX (Bug #02): Capture OLD status BEFORE overwriting it.
        // Previously the ternary `task.getStatus() == newStatus ? newStatus : task.getStatus()`
        // was inverted — it always passed the wrong value as oldStatus.
        String oldStatus = task.getStatus().name();

        task.setStatus(newStatus);
        Task updated = taskRepository.save(task);

        auditService.logStatusChange(taskId, task.getTitle(), oldStatus, newStatus.name(), username);
        return updated;
    }

    // =========================
    // DELETE TASK
    // =========================
    public void deleteTask(Long taskId, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        if (!task.getProject().getOwnerUsername().equals(username)) {
            throw new RuntimeException("Unauthorized");
        }
        String title = task.getTitle();
        taskRepository.delete(task);
        auditService.logTaskDelete(taskId, title, username);
    }

    // =========================
    // GANTT DATA
    // =========================
    public List<GanttTaskDTO> getGanttData(Long projectId, String username) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));
        if (!project.getOwnerUsername().equals(username)) {
            throw new UnauthorizedException("Unauthorized");
        }
        return taskRepository.findByProjectId(projectId).stream()
                .map(task -> new GanttTaskDTO(
                        task.getId(),
                        task.getTitle(),
                        task.getStartDate(),
                        task.getEndDate(),
                        calculateProgress(task),
                        task.getDependsOn() != null ? task.getDependsOn().getId() : null
                )).toList();
    }

    // =========================
    // CRITICAL PATH
    // =========================
    public CriticalPathDTO calculateCriticalPath(Long projectId, String username) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));
        if (!project.getOwnerUsername().equals(username)) {
            throw new UnauthorizedException("Unauthorized");
        }

        List<Task> tasks = taskRepository.findByProjectId(projectId);
        if (tasks.isEmpty()) {
            return new CriticalPathDTO(0, Collections.emptyList());
        }

        Map<Long, Task> taskMap     = new HashMap<>();
        Map<Long, Long> longestTime = new HashMap<>();

        for (Task t : tasks) {
            taskMap.put(t.getId(), t);
            longestTime.put(t.getId(), duration(t));
        }

        boolean updated;
        do {
            updated = false;
            for (Task task : tasks) {
                if (task.getDependsOn() != null) {
                    long parentTime = longestTime.get(task.getDependsOn().getId());
                    long candidate  = parentTime + duration(task);
                    if (candidate > longestTime.get(task.getId())) {
                        longestTime.put(task.getId(), candidate);
                        updated = true;
                    }
                }
            }
        } while (updated);

        Long criticalTaskId = longestTime.entrySet().stream()
                .max(Map.Entry.comparingByValue()).get().getKey();
        long totalDuration  = longestTime.get(criticalTaskId);

        List<CriticalPathDTO.CriticalTask> criticalTasks = new ArrayList<>();
        Task current = taskMap.get(criticalTaskId);
        while (current != null) {
            criticalTasks.add(new CriticalPathDTO.CriticalTask(current.getId(), current.getTitle()));
            current = current.getDependsOn();
        }
        Collections.reverse(criticalTasks);

        return new CriticalPathDTO(totalDuration, criticalTasks);
    }

    // =========================
    // ASSIGN TASK
    // FIX (Bug #01): Now validates that the target user actually exists in the DB
    // before assigning, preventing ghost/orphan assignments.
    // =========================
    public void assignTask(Long taskId, String assignToUsername, String currentUser) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ProjectNotFoundException("Task not found"));

        if (!task.getProject().getOwnerUsername().equals(currentUser)) {
            throw new UnauthorizedException("Only project owner can assign tasks");
        }

        // FIX: Validate the target user actually exists
        userRepository.findByUsername(assignToUsername)
                .orElseThrow(() -> new RuntimeException(
                        "User '" + assignToUsername + "' does not exist. Please enter a valid username."));

        task.setAssignedTo(assignToUsername);
        taskRepository.save(task);
        auditService.logAssign(task.getId(), task.getTitle(), assignToUsername, currentUser);

        // Notify the assigned user
        notificationService.create(
                assignToUsername,
                "TASK_ASSIGNED",
                "You were assigned to task \"" + task.getTitle() + "\" by " + currentUser,
                task.getProject().getId(),
                task.getId()
        );
    }

    // =========================
    // ANALYTICS
    // =========================
    public ProjectAnalyticsDTO getProjectAnalytics(Long projectId, String username) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));
        if (!project.getOwnerUsername().equals(username)) {
            throw new UnauthorizedException("Unauthorized");
        }

        List<Task> tasks = taskRepository.findByProjectId(projectId);
        long total      = tasks.size();
        long todo       = tasks.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count();
        long inProgress = tasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
        long done       = tasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
        int  completion = total == 0 ? 0 : (int) ((done * 100) / total);

        return new ProjectAnalyticsDTO(total, todo, inProgress, done, completion);
    }

    // =========================
    // SLACK (Float) CALCULATION
    // FIX (Bug #05): Rewrote the backward pass using correct topological ordering.
    // The old code was setting the current task's latestFinish to its parent's
    // latestFinish — but it should be propagating BACKWARDS: updating the
    // predecessor's latest finish based on the successor's requirement.
    // =========================
    public List<TaskSlackDTO> calculateSlack(Long projectId, String username) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));
        if (!project.getOwnerUsername().equals(username)) {
            throw new UnauthorizedException("Unauthorized");
        }

        List<Task> tasks = taskRepository.findByProjectId(projectId);
        if (tasks.isEmpty()) return Collections.emptyList();

        Map<Long, Task> taskMap       = new HashMap<>();
        Map<Long, Long> earlyFinish   = new HashMap<>();
        Map<Long, Long> lateFinish    = new HashMap<>();

        for (Task t : tasks) taskMap.put(t.getId(), t);

        // ── Forward pass: compute earliest finish for each task ──
        // Topological order: tasks with no dependency first, then dependents.
        List<Task> topoOrder = topologicalSort(tasks);
        for (Task t : topoOrder) {
            long dur = duration(t);
            if (t.getDependsOn() == null) {
                earlyFinish.put(t.getId(), dur);
            } else {
                long parentEF = earlyFinish.getOrDefault(t.getDependsOn().getId(), dur);
                earlyFinish.put(t.getId(), parentEF + dur);
            }
        }

        long projectDuration = earlyFinish.values().stream().max(Long::compare).orElse(0L);

        // ── Backward pass: compute latest finish for each task ──
        // All tasks that are not predecessors of anything get latestFinish = projectDuration.
        for (Task t : tasks) lateFinish.put(t.getId(), projectDuration);

        // Process in reverse topological order (leaves → roots)
        List<Task> reverseTopoOrder = new ArrayList<>(topoOrder);
        Collections.reverse(reverseTopoOrder);
        for (Task t : reverseTopoOrder) {
            if (t.getDependsOn() != null) {
                long myLateStart       = lateFinish.get(t.getId()) - duration(t);
                Long predecessorCurrent = lateFinish.get(t.getDependsOn().getId());
                // The predecessor must finish no later than our late start
                lateFinish.put(t.getDependsOn().getId(),
                        Math.min(predecessorCurrent, myLateStart));
            }
        }

        // ── Slack = latestFinish - earliestFinish ──
        List<TaskSlackDTO> result = new ArrayList<>();
        for (Task t : tasks) {
            long slack = lateFinish.get(t.getId()) - earlyFinish.get(t.getId());
            result.add(new TaskSlackDTO(t.getId(), t.getTitle(), Math.max(0, slack)));
        }
        return result;
    }

    /**
     * Returns tasks in topological order (dependencies before dependents).
     * Uses Kahn's algorithm (BFS-based). Falls back to original order if there are cycles.
     */
    private List<Task> topologicalSort(List<Task> tasks) {
        Map<Long, Task> taskMap = new HashMap<>();
        Map<Long, Integer> inDegree = new HashMap<>();
        Map<Long, List<Long>> dependents = new HashMap<>(); // task -> list of tasks that depend on it

        for (Task t : tasks) {
            taskMap.put(t.getId(), t);
            inDegree.put(t.getId(), 0);
            dependents.put(t.getId(), new ArrayList<>());
        }

        for (Task t : tasks) {
            if (t.getDependsOn() != null && taskMap.containsKey(t.getDependsOn().getId())) {
                inDegree.put(t.getId(), inDegree.get(t.getId()) + 1);
                dependents.get(t.getDependsOn().getId()).add(t.getId());
            }
        }

        Queue<Long> queue = new LinkedList<>();
        for (Map.Entry<Long, Integer> e : inDegree.entrySet()) {
            if (e.getValue() == 0) queue.add(e.getKey());
        }

        List<Task> sorted = new ArrayList<>();
        while (!queue.isEmpty()) {
            Long id = queue.poll();
            sorted.add(taskMap.get(id));
            for (Long dep : dependents.get(id)) {
                inDegree.put(dep, inDegree.get(dep) - 1);
                if (inDegree.get(dep) == 0) queue.add(dep);
            }
        }

        // If cycle detected, fall back to original order
        return sorted.size() == tasks.size() ? sorted : tasks;
    }

    private long duration(Task task) {
        if (task.getStartDate() == null || task.getEndDate() == null) return 1L;
        long d = java.time.temporal.ChronoUnit.DAYS.between(task.getStartDate(), task.getEndDate());
        return Math.max(1, d);
    }

    private TaskResponse mapToResponse(Task task, long slack) {
        List<Task> subtasks = taskRepository.findByParentTask_Id(task.getId());
        int subtaskDone = (int) subtasks.stream()
                .filter(s -> s.getStatus() == TaskStatus.DONE).count();

        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus().name())
                .priority(task.getPriority() != null ? task.getPriority() : "MEDIUM")
                .assignedTo(task.getAssignedTo())
                .startDate(task.getStartDate())
                .endDate(task.getEndDate())
                .dependencyTaskId(task.getDependsOn() != null ? task.getDependsOn().getId() : null)
                .critical(slack == 0)
                .slackDays(slack)
                .parentTaskId(task.getParentTask() != null ? task.getParentTask().getId() : null)
                .subtaskCount(subtasks.size())
                .subtaskDoneCount(subtaskDone)
                .build();
    }

    // =========================
    // GET MY TASKS
    // =========================
    public List<MyTaskDTO> getMyTasks(String username) {
        return taskRepository.findByAssignedTo(username).stream()
                .map(task -> MyTaskDTO.builder()
                        .taskId(task.getId())
                        .title(task.getTitle())
                        .description(task.getDescription())
                        .status(task.getStatus().name())
                        .assignedTo(task.getAssignedTo())
                        .startDate(task.getStartDate())
                        .endDate(task.getEndDate())
                        .projectId(task.getProject().getId())
                        .projectName(task.getProject().getName())
                        .projectOwner(task.getProject().getOwnerUsername())
                        .dependencyTaskId(task.getDependsOn() != null ? task.getDependsOn().getId() : null)
                        .build()
                ).toList();
    }

    // =========================
    // EDIT TASK (Feature 1)
    // FIX (Bug #03): Handle null dependsOnTaskId to REMOVE a dependency.
    // Previously if the user cleared the dependency in the UI (sending null),
    // the backend ignored it and the dependency could never be removed.
    // =========================
    public TaskResponse editTask(Long taskId, TaskRequest request, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!task.getProject().getOwnerUsername().equals(username)) {
            throw new UnauthorizedException("Only the project owner can edit tasks");
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            task.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription().isBlank() ? null : request.getDescription());
        }
        if (request.getStartDate() != null) {
            task.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            task.setEndDate(request.getEndDate());
        }

        // FIX: Use a flag from the request to distinguish "not provided" vs "explicitly null".
        // TaskRequest now has a 'clearDependency' field.
        // If dependsOnTaskId is set → assign it.
        // If clearDependency == true → remove dependency.
        // (Otherwise leave dependency unchanged.)
        if (request.isClearDependency()) {
            task.setDependsOn(null);
        } else if (request.getDependsOnTaskId() != null) {
            Task dep = taskRepository.findById(request.getDependsOnTaskId())
                    .orElseThrow(() -> new RuntimeException("Dependency task not found"));
            if (!dep.getProject().getId().equals(task.getProject().getId())) {
                throw new RuntimeException("Dependency must belong to same project");
            }
            task.setDependsOn(dep);
        }

        // Update priority if provided
        if (request.getPriority() != null &&
                List.of("LOW","MEDIUM","HIGH","URGENT").contains(request.getPriority())) {
            task.setPriority(request.getPriority());
        }

        TaskResponse result = mapToResponse(taskRepository.save(task), 0L);
        auditService.logTaskEdit(task.getId(), task.getTitle(), username);
        return result;
    }

    // =========================
    // SEARCH TASKS (Feature 6)
    // =========================
    public List<TaskResponse> searchTasks(Long projectId, String query, String status, String username) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));
        if (!project.getOwnerUsername().equals(username)) {
            throw new UnauthorizedException("Only the project owner can search all tasks");
        }

        return taskRepository.findByProjectId(projectId).stream()
                .filter(t -> {
                    boolean matchQuery  = query == null || query.isBlank()
                            || t.getTitle().toLowerCase().contains(query.toLowerCase())
                            || (t.getDescription() != null
                            && t.getDescription().toLowerCase().contains(query.toLowerCase()));
                    boolean matchStatus = status == null || status.isBlank()
                            || t.getStatus().name().equalsIgnoreCase(status);
                    return matchQuery && matchStatus;
                })
                .map(t -> mapToResponse(t, 0L))
                .toList();
    }

    // =========================
    // WORKLOAD PER USER (Feature 8)
    // =========================
    public List<WorkloadDTO> getWorkload(Long projectId, String username) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));
        if (!project.getOwnerUsername().equals(username)) {
            throw new UnauthorizedException("Only the project owner can view workload");
        }

        java.time.LocalDate today = java.time.LocalDate.now();

        return taskRepository.findByProjectId(projectId).stream()
                .filter(t -> t.getAssignedTo() != null)
                .collect(Collectors.groupingBy(Task::getAssignedTo))
                .entrySet().stream()
                .map(e -> {
                    List<Task> ut  = e.getValue();
                    long todo      = ut.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count();
                    long inProgress = ut.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
                    long done       = ut.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
                    long overdue    = ut.stream().filter(t ->
                            t.getStatus() != TaskStatus.DONE
                                    && t.getEndDate() != null
                                    && t.getEndDate().isBefore(today)).count();
                    return new WorkloadDTO(e.getKey(), ut.size(), todo, inProgress, done, overdue);
                })
                .sorted(Comparator.comparingLong(WorkloadDTO::getTotalAssigned).reversed())
                .toList();
    }

    // =========================
    // GET SUBTASKS
    // =========================
    public List<com.projectmanagertool.pm_backend.dto.TaskResponse> getSubtasks(Long parentTaskId) {
        return taskRepository.findByParentTask_Id(parentTaskId)
                .stream().map(t -> mapToResponse(t, 0L)).toList();
    }

}