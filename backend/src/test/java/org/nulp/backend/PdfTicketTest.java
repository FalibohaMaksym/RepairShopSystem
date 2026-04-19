package org.nulp.backend;

import org.junit.jupiter.api.Test;
import org.nulp.backend.dto.response.OrderDetailResponse;
import org.nulp.backend.service.PdfService;

import java.io.FileOutputStream;
import java.math.BigDecimal;
import java.nio.file.Path;
import java.time.LocalDateTime;

class PdfTicketTest {

//    @Test
//    void generateSampleTicket() throws Exception {
//        OrderDetailResponse order = new OrderDetailResponse(
//                1042,
//                "OR10698058",
//                "нове",
//                null,
//                LocalDateTime.of(2026, 4, 19, 14, 23),
//                "Не вмикається, індикатор заряду не горить. При підключенні до мережі нічого не відбувається.",
//
//                12,
//                "Іванченко Олексій Петрович",
//                "+380671234567",
//                "ivan@repairshop.ua",
//                "вул. Шевченка, 5",
//
//                5,
//                "Ростислав Кулинич",
//                "+380991234567",
//                "rostyk@email.com",
//
//                6804,
//                "374c7903abd9461ab042",
//                "Подряпини на корпусі, невелике вм'ятіння на кришці",
//
//                31,
//                "ROG Strix G15 G513RM",
//                "Ноутбук",
//                "Asus"
//        );
//
//        PdfService pdfService = new PdfService();
//        byte[] pdf = pdfService.generateRepairTicket(order);
//
//        Path outputPath = Path.of("ticket-test.pdf");
//        try (FileOutputStream fos = new FileOutputStream(outputPath.toFile())) {
//            fos.write(pdf);
//        }
//
//        System.out.println("PDF збережено: " + outputPath.toAbsolutePath());
//    }
}
