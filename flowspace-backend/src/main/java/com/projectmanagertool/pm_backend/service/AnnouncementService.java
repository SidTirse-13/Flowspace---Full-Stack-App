package com.projectmanagertool.pm_backend.service;

import com.projectmanagertool.pm_backend.dto.AnnouncementDTO;
import com.projectmanagertool.pm_backend.model.Project;
import com.projectmanagertool.pm_backend.model.ProjectAnnouncement;
import com.projectmanagertool.pm_backend.repository.ProjectAnnouncementRepository;
import com.projectmanagertool.pm_backend.repository.ProjectRepository;
import com.projectmanagertool.pm_backend.repository.ProjectMemberRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AnnouncementService {

    private final ProjectAnnouncementRepository announcementRepo;
    private final ProjectRepository projectRepo;
    private final ProjectMemberRepository memberRepo;

    public AnnouncementService(ProjectAnnouncementRepository announcementRepo,
                               ProjectRepository projectRepo,
                               ProjectMemberRepository memberRepo) {
        this.announcementRepo = announcementRepo;
        this.projectRepo = projectRepo;
        this.memberRepo = memberRepo;
    }

    public AnnouncementDTO create(Long projectId, String content, String username) {
        Project project = projectRepo.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        boolean isOwner = project.getOwnerUsername().equals(username);
        boolean isMember = memberRepo.existsByProjectIdAndUsername(projectId, username);
        if (!isOwner && !isMember) throw new RuntimeException("Not a project member");

        ProjectAnnouncement ann = new ProjectAnnouncement();
        ann.setProject(project); ann.setAuthorUsername(username);
        ann.setContent(content.trim()); ann.setPinned(true);
        return toDTO(announcementRepo.save(ann));
    }

    public List<AnnouncementDTO> getForProject(Long projectId) {
        return announcementRepo.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream().map(this::toDTO).toList();
    }

    public void delete(Long id, String username) {
        ProjectAnnouncement ann = announcementRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found"));
        Project project = ann.getProject();
        if (!ann.getAuthorUsername().equals(username) && !project.getOwnerUsername().equals(username))
            throw new RuntimeException("Cannot delete this announcement");
        announcementRepo.delete(ann);
    }

    public AnnouncementDTO togglePin(Long id, String username) {
        ProjectAnnouncement ann = announcementRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found"));
        ann.setPinned(!ann.isPinned());
        return toDTO(announcementRepo.save(ann));
    }

    private AnnouncementDTO toDTO(ProjectAnnouncement a) {
        return AnnouncementDTO.builder().id(a.getId())
                .projectId(a.getProject().getId()).authorUsername(a.getAuthorUsername())
                .content(a.getContent()).pinned(a.isPinned()).createdAt(a.getCreatedAt()).build();
    }
}
