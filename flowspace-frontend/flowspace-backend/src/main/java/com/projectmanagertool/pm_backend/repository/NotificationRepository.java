package com.projectmanagertool.pm_backend.repository;

import com.projectmanagertool.pm_backend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientUsernameOrderByCreatedAtDesc(String username);
    long countByRecipientUsernameAndReadFalse(String username);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipientUsername = :username")
    void markAllReadForUser(String username);
}
