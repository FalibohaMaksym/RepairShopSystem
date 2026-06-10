package org.nulp.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.request.CreateUserRequest;
import org.nulp.backend.dto.request.UpdateUserRequest;
import org.nulp.backend.dto.response.UserResponse;
import org.nulp.backend.dto.response.WorkerResponse;
import org.nulp.backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // Список системних користувачів (з роллю) — тільки адміни
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<List<UserResponse>> getAll() {
        return ResponseEntity.ok(userService.getAll());
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyAuthority('ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<List<UserResponse>> search(@RequestParam String query) {
        return ResponseEntity.ok(userService.search(query));
    }

    // Створення нового користувача разом із працівником
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.create(request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Редагування користувача (дані user + worker)
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<UserResponse> update(@PathVariable Integer id,
                                               @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.update(id, request));
    }

    // Список усіх працівників (для вибору при створенні замовлення тощо)
    @GetMapping("/workers")
    @PreAuthorize("hasAnyAuthority('ROLE_Майстер', 'ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<List<WorkerResponse>> getAllWorkers() {
        return ResponseEntity.ok(userService.getAllWorkers());
    }

    @GetMapping("/workers/search")
    @PreAuthorize("hasAnyAuthority('ROLE_Майстер', 'ROLE_Адміністратор', 'ROLE_Старший адміністратор', 'ROLE_Системний адміністратор')")
    public ResponseEntity<List<WorkerResponse>> searchWorkers(@RequestParam String query) {
        return ResponseEntity.ok(userService.searchWorkers(query));
    }
}
