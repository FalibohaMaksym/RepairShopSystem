package org.nulp.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "CustomerDevice", schema = "dbo", uniqueConstraints = {
        @UniqueConstraint(name = "IX_CustomerDevice", columnNames = {"DeviceSerialNumber"})
})
public class CustomerDevice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CustomerDevicePK", nullable = false)
    private Integer id;

    @Size(max = 20)
    @NotNull
    @Column(name = "DeviceSerialNumber", nullable = false, length = 20)
    private String deviceSerialNumber;

    @NotNull
    @Lob
    @Column(name = "ExternalConditionDescription", nullable = false)
    private String externalConditionDescription;

    @Column(name = "DeviceUsageTime")
    private Integer deviceUsageTime;

    @Lob
    @Column(name = "DeviceAdditionalInfo")
    private String deviceAdditionalInfo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DeviceId")
    private Device device;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CustomerId")
    private Customer customer;

    @ColumnDefault("getdate()")
    @Column(name = "CreateDatetime")
    private LocalDateTime createDatetime;

    @Column(name = "UpdateDatetime")
    private LocalDateTime updateDatetime;

}