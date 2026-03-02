package com.projectmanagertool.pm_backend.repository;
import com.projectmanagertool.pm_backend.model.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserStatusRepository extends JpaRepository<UserStatus, String> {
    List<UserStatus> findByUsernameIn(List<String> usernames);
}
