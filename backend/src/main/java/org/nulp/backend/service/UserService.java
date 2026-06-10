package org.nulp.backend.service;

import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.request.CreateUserRequest;
import org.nulp.backend.dto.request.UpdateUserRequest;
import org.nulp.backend.dto.response.UserResponse;
import org.nulp.backend.dto.response.WorkerResponse;
import org.nulp.backend.entity.Branch;
import org.nulp.backend.entity.Position;
import org.nulp.backend.entity.Role;
import org.nulp.backend.entity.User;
import org.nulp.backend.entity.Worker;
import org.nulp.backend.exception.ResourceNotFoundException;
import org.nulp.backend.repository.BranchRepository;
import org.nulp.backend.repository.PositionRepository;
import org.nulp.backend.repository.RoleRepository;
import org.nulp.backend.repository.UserRepository;
import org.nulp.backend.repository.WorkerRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final WorkerRepository workerRepository;
    private final RoleRepository roleRepository;
    private final PositionRepository positionRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponse> getAll() {
        return userRepository.findAllWithDetails().stream()
                .map(this::toUserResponse)
                .toList();
    }

    public List<UserResponse> search(String query) {
        return userRepository.searchWithDetails(query).stream()
                .map(this::toUserResponse)
                .toList();
    }

    public List<WorkerResponse> getAllWorkers() {
        return workerRepository.findAllWithDetails().stream()
                .map(this::toWorkerResponse)
                .toList();
    }

    public List<WorkerResponse> searchWorkers(String query) {
        return workerRepository.searchWithDetails(query).stream()
                .map(this::toWorkerResponse)
                .toList();
    }

    @Transactional
    public void delete(Integer id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found: " + id);
        }
        // Видаляємо лише запис User — Worker залишається
        userRepository.deleteById(id);
    }

    @Transactional
    public UserResponse update(Integer id, UpdateUserRequest request) {
        User user = userRepository.findByIdWithWorker(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        Role role = roleRepository.findById(request.roleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + request.roleId()));

        Branch branch = branchRepository.findById(request.branchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found: " + request.branchId()));

        Position position = null;
        if (request.positionId() != null) {
            position = positionRepository.findById(request.positionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Position not found: " + request.positionId()));
        }

        // Оновлюємо дані працівника
        Worker worker = user.getWorker();
        worker.setWorkerFullName(request.fullName());
        worker.setWorkerPhoneNumber(request.phoneNumber());
        worker.setWorkerEmail(request.email());
        worker.setPosition(position);
        worker.setBranch(branch);
        workerRepository.save(worker);

        // Оновлюємо роль та пароль (якщо переданий)
        user.setRole(role);
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        userRepository.save(user);

        return userRepository.findByIdWithWorker(id)
                .map(this::toUserResponse)
                .orElseThrow();
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        Role role = roleRepository.findById(request.roleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + request.roleId()));

        Branch branch = branchRepository.findById(request.branchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found: " + request.branchId()));

        Position position = null;
        if (request.positionId() != null) {
            position = positionRepository.findById(request.positionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Position not found: " + request.positionId()));
        }

        // 1. Створюємо працівника
        Worker worker = new Worker();
        worker.setWorkerFullName(request.fullName());
        worker.setWorkerPhoneNumber(request.phoneNumber());
        worker.setWorkerEmail(request.email());
        worker.setPosition(position);
        worker.setBranch(branch);
        Worker savedWorker = workerRepository.save(worker);

        // 2. Створюємо прив'язаного користувача
        User user = new User();
        user.setWorker(savedWorker);
        user.setRole(role);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        User savedUser = userRepository.save(user);

        // Повертаємо з усіма деталями
        return userRepository.findByIdWithWorker(savedUser.getId())
                .map(this::toUserResponse)
                .orElseThrow();
    }

    private UserResponse toUserResponse(User u) {
        Worker w = u.getWorker();
        Role role = u.getRole();
        Position pos = w.getPosition();
        Branch branch = w.getBranch();

        return new UserResponse(
                u.getId(),
                w.getId(),
                w.getWorkerFullName(),
                w.getWorkerEmail(),
                w.getWorkerPhoneNumber(),
                pos != null ? pos.getPositionName() : null,
                branch != null ? branch.getId() : null,
                branch != null ? branch.getBranchAddress() : null,
                role != null ? role.getId() : null,
                role != null ? role.getRoleName() : null
        );
    }

    private WorkerResponse toWorkerResponse(Worker w) {
        Position pos = w.getPosition();
        Branch branch = w.getBranch();
        return new WorkerResponse(
                w.getId(),
                w.getWorkerFullName(),
                w.getWorkerPhoneNumber(),
                w.getWorkerEmail(),
                pos != null ? pos.getPositionName() : null,
                branch != null ? branch.getId() : null,
                branch != null ? branch.getBranchAddress() : null
        );
    }
}
