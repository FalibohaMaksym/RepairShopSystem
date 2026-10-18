package edu.nulp.diploma.repair.dto.response;

public class CreateRepairResponse {
    private Long id;
    private String deviceSerialNumber;
    private String problem;

    public CreateRepairResponse() {
    }

    public CreateRepairResponse(Long id, String deviceSerialNumber, String problem) {
        this.id = id;
        this.deviceSerialNumber = deviceSerialNumber;
        this.problem = problem;
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
}
