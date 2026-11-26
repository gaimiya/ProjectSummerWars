package app.kintai.monthly;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CsvExporterTest {
    @Test
    void BOM付きで値をダブルクオートで囲む() {
        String csv = CsvExporter.toCsv(List.of("氏名", "メモ"), List.of(List.of("山田", "a\"b")));
        assertThat(csv).isEqualTo("﻿\"氏名\",\"メモ\"\r\n\"山田\",\"a\"\"b\"\r\n");
    }
}
