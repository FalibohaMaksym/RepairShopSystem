package edu.nulp.diploma.repair.dto.request;

public class CreateRepairRequest {
    private String deviceSerialNumber;
    private String problem;

    public CreateRepairRequest() {}

    public CreateRepairRequest(String deviceSerialNumber, String problem) {
        this.deviceSerialNumber = deviceSerialNumber;
        this.problem = problem;
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
