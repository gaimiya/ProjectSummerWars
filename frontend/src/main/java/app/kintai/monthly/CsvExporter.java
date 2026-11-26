package app.kintai.monthly;

import java.util.List;
import java.util.stream.Collectors;

/** 社労士へ渡すCSV。Excelで文字化けしないよう先頭にBOMを付ける */
public final class CsvExporter {
    private CsvExporter() {}

    public static String toCsv(List<String> header, List<List<String>> rows) {
        StringBuilder sb = new StringBuilder("﻿");
        sb.append(line(header));
        rows.forEach(r -> sb.append(line(r)));
        return sb.toString();
    }

    private static String line(List<String> cells) {
        return cells.stream().map(c -> "\"" + (c == null ? "" : c.replace("\"", "\"\"")) + "\"")
                .collect(Collectors.joining(",")) + "\r\n";
    }
}
