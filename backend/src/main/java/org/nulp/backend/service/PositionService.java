package org.nulp.backend.service;

import lombok.RequiredArgsConstructor;
import org.nulp.backend.dto.response.PositionResponse;
import org.nulp.backend.entity.Position;
import org.nulp.backend.repository.PositionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service @RequiredArgsConstructor
public class PositionService {
    private final PositionRepository positionRepository;
    public List<PositionResponse> getAll() {
        return positionRepository.findAll().stream().map(this::toResponse).toList();
    }
    private PositionResponse toResponse(Position p) {
        return new PositionResponse(p.getId(), p.getPositionName());
    }
}
