// 担当：山川さん（月次集計・社労士への送付）。変更する前に同じフォルダか担当フォルダの README.md を読み、担当外の人は担当者に相談する
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
