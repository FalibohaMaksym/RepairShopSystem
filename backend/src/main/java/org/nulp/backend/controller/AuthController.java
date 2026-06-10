package org.nulp.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.request.LoginRequest;
import org.nulp.backend.dto.response.AuthResponse;
import org.nulp.backend.entity.User;
import org.nulp.backend.security.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.login(), request.password())
        );

        User user = (User) auth.getPrincipal();
        return ResponseEntity.ok(buildAuthResponse(user));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(buildAuthResponse(user));
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(user);
        String role = user.getRole() != null ? user.getRole().getRoleName() : null;
        Integer workerId = user.getWorker() != null ? user.getWorker().getId() : null;
        String fullName = user.getWorker() != null ? user.getWorker().getWorkerFullName() : null;
        return new AuthResponse(token, role, user.getId(), workerId, fullName);
    }
}
