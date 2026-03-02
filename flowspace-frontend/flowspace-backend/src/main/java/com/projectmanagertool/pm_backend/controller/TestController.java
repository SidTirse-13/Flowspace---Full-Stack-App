package com.projectmanagertool.pm_backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/api/secure")
    public String secure() {
        return "You accessed a secured API 🔐";
    }
}
