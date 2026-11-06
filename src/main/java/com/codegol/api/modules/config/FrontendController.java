package com.codegol.api.modules.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Routes the React application paths back to its entry point for BrowserRouter. */
@Controller
public class FrontendController {

    @GetMapping({"/login", "/consulta-publica", "/admin", "/admin/**"})
    public String forwardToFrontend() {
        return "forward:/index.html";
    }
}
