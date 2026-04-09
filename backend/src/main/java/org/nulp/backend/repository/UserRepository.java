package org.nulp.backend.repository;

import org.nulp.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {

    @Query("SELECT u FROM User u JOIN FETCH u.worker w LEFT JOIN FETCH u.role LEFT JOIN FETCH w.position LEFT JOIN FETCH w.branch WHERE w.workerEmail = :login OR w.workerPhoneNumber = :login")
    Optional<User> findByLogin(@Param("login") String login);

    @Query("SELECT u FROM User u JOIN FETCH u.worker w LEFT JOIN FETCH u.role LEFT JOIN FETCH w.position LEFT JOIN FETCH w.branch WHERE u.id = :id")
    Optional<User> findByIdWithWorker(@Param("id") Integer id);

    @Query("SELECT u FROM User u JOIN FETCH u.worker w LEFT JOIN FETCH u.role LEFT JOIN FETCH w.position LEFT JOIN FETCH w.branch ORDER BY w.workerFullName")
    List<User> findAllWithDetails();

    @Query("SELECT u FROM User u JOIN FETCH u.worker w LEFT JOIN FETCH u.role LEFT JOIN FETCH w.position LEFT JOIN FETCH w.branch WHERE LOWER(w.workerFullName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(w.workerEmail) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY w.workerFullName")
    List<User> searchWithDetails(@Param("query") String query);
}
