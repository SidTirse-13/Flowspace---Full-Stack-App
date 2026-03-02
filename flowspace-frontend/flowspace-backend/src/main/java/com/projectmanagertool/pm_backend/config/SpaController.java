package com.projectmanagertool.pm_backend.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    // Catch all non-API routes and serve React's index.html
    // React Router will then handle the route on the client side
    @RequestMapping(value = {
            "/",
            "/login",
            "/register",
            "/dashboard",
            "/projects/**",      // covers /projects/1, /projects/1/analytics, etc.
    })
    public String redirect() {
        return "forward:/index.html";
    }
}