package com.projectmanagertool.pm_backend.controller;

import com.projectmanagertool.pm_backend.dto.AttachmentDTO;
import com.projectmanagertool.pm_backend.model.Task;
import com.projectmanagertool.pm_backend.model.TaskAttachment;
import com.projectmanagertool.pm_backend.repository.TaskAttachmentRepository;
import com.projectmanagertool.pm_backend.repository.TaskRepository;
import com.projectmanagertool.pm_backend.service.AuditService;
import com.projectmanagertool.pm_backend.service.FileStorageService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects/{projectId}/tasks/{taskId}/attachments")
public class AttachmentController {

    private final TaskRepository           taskRepository;
    private final TaskAttachmentRepository attachmentRepository;
    private final FileStorageService       fileStorageService;
    private final AuditService             auditService;

    public AttachmentController(TaskRepository taskRepository,
                                TaskAttachmentRepository attachmentRepository,
                                FileStorageService fileStorageService,
                                AuditService auditService) {
        this.taskRepository      = taskRepository;
        this.attachmentRepository = attachmentRepository;
        this.fileStorageService  = fileStorageService;
        this.auditService        = auditService;
    }

    // ── GET: list attachments for a task ──────────────────────────
    @GetMapping
    public List<AttachmentDTO> getAttachments(@PathVariable Long taskId) {
        return attachmentRepository.findByTaskIdOrderByUploadedAtDesc(taskId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ── POST: upload a file ───────────────────────────────────────
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AttachmentDTO uploadFile(@PathVariable Long taskId,
                                    @RequestParam("file") MultipartFile file,
                                    Authentication authentication) throws Exception {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        String stored = fileStorageService.storeFile(file);

        TaskAttachment att = TaskAttachment.builder()
                .fileName(file.getOriginalFilename())
                .storedFileName(stored)
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .uploadedBy(authentication.getName())
                .task(task)
                .build();

        TaskAttachment saved = attachmentRepository.save(att);

        auditService.log("TASK", taskId, "ATTACHMENT_UPLOAD",
                authentication.getName() + " uploaded \"" + file.getOriginalFilename()
                        + "\" to task \"" + task.getTitle() + "\"",
                authentication.getName());

        return toDTO(saved);
    }

    // ── GET /{id}: download a file ────────────────────────────────
    @GetMapping("/{attachmentId}")
    public ResponseEntity<ByteArrayResource> downloadFile(@PathVariable Long attachmentId)
            throws Exception {
        TaskAttachment att = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));

        byte[] data = fileStorageService.loadFile(att.getStoredFileName());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(att.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + att.getFileName() + "\"")
                .contentLength(data.length)
                .body(new ByteArrayResource(data));
    }

    // ── DELETE /{id}: remove a file ───────────────────────────────
    @DeleteMapping("/{attachmentId}")
    public String deleteFile(@PathVariable Long attachmentId,
                             Authentication authentication) {
        TaskAttachment att = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));

        String username = authentication.getName();
        boolean isOwner    = att.getTask().getProject().getOwnerUsername().equals(username);
        boolean isUploader = att.getUploadedBy().equals(username);

        if (!isOwner && !isUploader) {
            throw new RuntimeException("Only the uploader or project owner can delete attachments");
        }

        fileStorageService.deleteFile(att.getStoredFileName());
        attachmentRepository.delete(att);

        return "Attachment deleted";
    }

    // ── DTO mapper ────────────────────────────────────────────────
    private AttachmentDTO toDTO(TaskAttachment a) {
        return AttachmentDTO.builder()
                .id(a.getId())
                .fileName(a.getFileName())
                .fileSize(a.getFileSize())
                .contentType(a.getContentType())
                .uploadedBy(a.getUploadedBy())
                .uploadedAt(a.getUploadedAt())
                .build();
    }
}