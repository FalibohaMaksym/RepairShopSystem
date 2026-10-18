package edu.nulp.diploma.projection.view;

import java.math.BigDecimal;
import java.time.Instant;

public class RepairView {
    private Long id;
    private String deviceSerialNumber;
    private String problem;
    private String status;
    private BigDecimal price;
    private Instant lastUpdated;

    public RepairView() {}

    public RepairView(Long id, String deviceSerialNumber, String problem, String status, BigDecimal price, Instant lastUpdated) {
        this.id = id;
        this.deviceSerialNumber = deviceSerialNumber;
        this.problem = problem;
        this.status = status;
        this.price = price;
        this.lastUpdated = lastUpdated;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDeviceSerialNumber() {
        return deviceSerialNumber;
    }

    public void setDeviceSerialNumber(String deviceSerialNumber) {
        this.deviceSerialNumber = deviceSerialNumber;
    }

    public String getProblem() {
        return problem;
    }

    public void setProblem(String problem) {
        this.problem = problem;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Instant getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(Instant lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}
