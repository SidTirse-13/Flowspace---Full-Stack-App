package com.projectmanagertool.pm_backend.service;

import com.projectmanagertool.pm_backend.model.User;
import com.projectmanagertool.pm_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // FIX (Bug #09): Inject the Spring bean from PasswordConfig instead of
    // creating a new instance manually (which bypassed the configured bean).
    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    public User register(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }
}
