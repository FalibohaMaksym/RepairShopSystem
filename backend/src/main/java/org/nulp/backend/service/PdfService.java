package org.nulp.backend.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import org.nulp.backend.dto.response.OrderDetailResponse;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class PdfService {

    private static final DateTimeFormatter DATE_TIME_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final Color HEADER_COLOR = new Color(33, 64, 154);
    private static final Color SECTION_COLOR = new Color(240, 244, 255);
    private static final Color BORDER_COLOR = new Color(180, 190, 220);

    public byte[] generateRepairTicket(OrderDetailResponse order) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] fontBytes = new ClassPathResource("fonts/FreeSans.ttf").getInputStream().readAllBytes();
            BaseFont baseFont = BaseFont.createFont("FreeSans.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true, fontBytes, null);

            Font titleFont   = new Font(baseFont, 18, Font.BOLD,  Color.WHITE);
            Font subFont     = new Font(baseFont, 11, Font.BOLD,  HEADER_COLOR);
            Font labelFont   = new Font(baseFont, 9,  Font.BOLD,  Color.DARK_GRAY);
            Font valueFont   = new Font(baseFont, 9,  Font.NORMAL, Color.BLACK);
            Font smallFont   = new Font(baseFont, 8,  Font.ITALIC, Color.GRAY);
            Font sectionFont = new Font(baseFont, 10, Font.BOLD,  HEADER_COLOR);

            Document doc = new Document(PageSize.A4, 40, 40, 40, 40);
            PdfWriter.getInstance(doc, out);
            doc.open();

            // ── Заголовок ─────────────────────────────────────────────────────
            PdfPTable header = new PdfPTable(1);
            header.setWidthPercentage(100);
            PdfPCell headerCell = new PdfPCell();
            headerCell.setBackgroundColor(HEADER_COLOR);
            headerCell.setPadding(12);
            headerCell.setBorder(Rectangle.NO_BORDER);

            Paragraph title = new Paragraph("РЕМОНТНИЙ ТАЛОН", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            headerCell.addElement(title);

            Paragraph orderNum = new Paragraph("№ " + order.orderNumber(), subFont);
            orderNum.getFont().setColor(Color.WHITE);
            orderNum.setAlignment(Element.ALIGN_CENTER);
            headerCell.addElement(orderNum);

            header.addCell(headerCell);
            doc.add(header);
            doc.add(Chunk.NEWLINE);

            // ── Дати ──────────────────────────────────────────────────────────
            PdfPTable datesTable = new PdfPTable(2);
            datesTable.setWidthPercentage(100);
            datesTable.setWidths(new float[]{1, 1});

            addDateCell(datesTable, "Дата створення замовлення:",
                    order.orderCreationTime() != null ? order.orderCreationTime().format(DATE_TIME_FMT) : "—",
                    labelFont, valueFont);
            addDateCell(datesTable, "Дата видачі талону:",
                    LocalDateTime.now().format(DATE_TIME_FMT),
                    labelFont, valueFont);
            doc.add(datesTable);
            doc.add(Chunk.NEWLINE);

            // ── Клієнт ────────────────────────────────────────────────────────
            doc.add(sectionHeader("КЛІЄНТ", sectionFont));
            PdfPTable clientTable = new PdfPTable(2);
            clientTable.setWidthPercentage(100);
            clientTable.setWidths(new float[]{1, 1});

            addInfoCell(clientTable, "ПІБ:", nvl(order.customerFullName()), labelFont, valueFont);
            addInfoCell(clientTable, "Телефон:", nvl(order.customerPhoneNumber()), labelFont, valueFont);
            addInfoCell(clientTable, "Email:", nvl(order.customerEmail()), labelFont, valueFont);
            addInfoCell(clientTable, "", "", labelFont, valueFont);
            doc.add(clientTable);
            doc.add(Chunk.NEWLINE);

            // ── Пристрій ──────────────────────────────────────────────────────
            doc.add(sectionHeader("ПРИСТРІЙ", sectionFont));
            PdfPTable deviceTable = new PdfPTable(2);
            deviceTable.setWidthPercentage(100);
            deviceTable.setWidths(new float[]{1, 1});

            addInfoCell(deviceTable, "Модель:", nvl(order.deviceModel()), labelFont, valueFont);
            addInfoCell(deviceTable, "Тип:", nvl(order.deviceTypeName()), labelFont, valueFont);
            addInfoCell(deviceTable, "Виробник:", nvl(order.producerName()), labelFont, valueFont);
            addInfoCell(deviceTable, "Серійний номер:", nvl(order.deviceSerialNumber()), labelFont, valueFont);
            doc.add(deviceTable);

            // Зовнішній стан — окремий рядок на всю ширину
            PdfPTable condTable = new PdfPTable(1);
            condTable.setWidthPercentage(100);
            addFullWidthCell(condTable, "Зовнішній стан:", nvl(order.externalConditionDescription()), labelFont, valueFont);
            doc.add(condTable);
            doc.add(Chunk.NEWLINE);

            // ── Опис проблеми ─────────────────────────────────────────────────
            doc.add(sectionHeader("ОПИС ПРОБЛЕМИ", sectionFont));
            PdfPTable problemTable = new PdfPTable(1);
            problemTable.setWidthPercentage(100);
            addFullWidthCell(problemTable, null, nvl(order.problemDescription()), labelFont, valueFont);
            doc.add(problemTable);
            doc.add(Chunk.NEWLINE);

            // ── Відповідальний ────────────────────────────────────────────────
            doc.add(sectionHeader("ВІДПОВІДАЛЬНИЙ ПРАЦІВНИК", sectionFont));
            PdfPTable workerTable = new PdfPTable(2);
            workerTable.setWidthPercentage(100);
            workerTable.setWidths(new float[]{1, 1});

            addInfoCell(workerTable, "ПІБ:", nvl(order.workerFullName()), labelFont, valueFont);
            addInfoCell(workerTable, "Телефон:", nvl(order.workerPhoneNumber()), labelFont, valueFont);
            addInfoCell(workerTable, "Відділення:", nvl(order.branchAddress()), labelFont, valueFont);
            addInfoCell(workerTable, "", "", labelFont, valueFont);
            doc.add(workerTable);
            doc.add(Chunk.NEWLINE);

            // ── Підписи ───────────────────────────────────────────────────────
            PdfPTable sigTable = new PdfPTable(2);
            sigTable.setWidthPercentage(100);
            sigTable.setWidths(new float[]{1, 1});

            addSignCell(sigTable, "Підпис клієнта:", valueFont);
            addSignCell(sigTable, "Підпис працівника:", valueFont);
            doc.add(sigTable);
            doc.add(Chunk.NEWLINE);

            // ── Футер ─────────────────────────────────────────────────────────
            Paragraph footer = new Paragraph("Цей талон є підтвердженням прийому пристрою в ремонт.", smallFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            doc.add(footer);

            doc.close();
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF ticket", e);
        }
    }

    // ── Допоміжні методи ──────────────────────────────────────────────────────

    private Paragraph sectionHeader(String text, Font font) {
        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(SECTION_COLOR);
        cell.setBorderColor(BORDER_COLOR);
        cell.setPadding(5);
        t.addCell(cell);
        // повертаємо порожній параграф і додамо таблицю окремо — але тут простіше повернути Paragraph
        Paragraph p = new Paragraph(text, font);
        p.setSpacingBefore(4);
        p.setSpacingAfter(4);
        return p;
    }

    private void addDateCell(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(SECTION_COLOR);
        cell.setBorderColor(BORDER_COLOR);
        cell.setPadding(6);
        cell.addElement(new Phrase(label, labelFont));
        cell.addElement(new Phrase(value, valueFont));
        table.addCell(cell);
    }

    private void addInfoCell(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBorderColor(BORDER_COLOR);
        cell.setPadding(5);
        if (!label.isEmpty()) {
            cell.addElement(new Phrase(label, labelFont));
        }
        cell.addElement(new Phrase(value, valueFont));
        table.addCell(cell);
    }

    private void addFullWidthCell(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBorderColor(BORDER_COLOR);
        cell.setPadding(5);
        if (label != null) {
            cell.addElement(new Phrase(label, labelFont));
        }
        cell.addElement(new Phrase(value, valueFont));
        table.addCell(cell);
    }

    private void addSignCell(PdfPTable table, String label, Font valueFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBorderColor(BORDER_COLOR);
        cell.setPadding(10);
        cell.setMinimumHeight(40);
        cell.addElement(new Phrase(label + "  ___________________________", valueFont));
        table.addCell(cell);
    }

    private String nvl(String value) {
        return value != null ? value : "—";
    }
}
