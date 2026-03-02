package com.projectmanagertool.pm_backend.repository;
import com.projectmanagertool.pm_backend.model.DirectMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {
    @Query("SELECT m FROM DirectMessage m WHERE (m.senderUsername=:a AND m.recipientUsername=:b) OR (m.senderUsername=:b AND m.recipientUsername=:a) ORDER BY m.sentAt ASC")
    List<DirectMessage> findConversation(String a, String b);

    @Query("SELECT DISTINCT CASE WHEN m.senderUsername=:username THEN m.recipientUsername ELSE m.senderUsername END FROM DirectMessage m WHERE m.senderUsername=:username OR m.recipientUsername=:username")
    List<String> findConversationPartners(String username);

    long countBySenderUsernameAndRecipientUsernameAndIsReadFalse(String sender, String recipient);

    @Modifying
    @Query("UPDATE DirectMessage m SET m.isRead=true WHERE m.senderUsername=:sender AND m.recipientUsername=:recipient")
    void markConversationRead(String sender, String recipient);
}
