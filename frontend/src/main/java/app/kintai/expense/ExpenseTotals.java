package app.kintai.expense;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

/**
 * フォームの回答シート（1行目が見出し）から、承認済みの金額を社員番号ごとに合計する。
 * 見出しは「含む」で探すので、既存のフォームでも「社員番号」「日付（利用日）」「金額」「承認」の列があれば使える。
 */
public final class ExpenseTotals {
    private ExpenseTotals() {}

    public static Map<String, Integer> sum(List<List<String>> rows, YearMonth ym) {
        Map<String, Integer> out = new HashMap<>();
        if (rows == null || rows.size() < 2) return out;
        List<String> head = rows.get(0);
        int no = col(head, "社員番号"), date = col(head, "利用日", "日付", "使用日"), amount = col(head, "金額"), ok = col(head, "承認");
        if (no < 0 || date < 0 || amount < 0 || ok < 0) return out;
        for (List<String> r : rows.subList(1, rows.size())) {
            if (!isTrue(get(r, ok))) continue;
            LocalDate d = parseDate(get(r, date));
            if (d == null || !YearMonth.from(d).equals(ym)) continue;
            String key = get(r, no).trim().toUpperCase();
            int yen = parseYen(get(r, amount));
            if (!key.isEmpty()) out.merge(key, yen, Integer::sum);
        }
        return out;
    }

    /** 足りない見出し（画面で知らせる用） */
    public static List<String> missingHeaders(List<String> head) {
        List<String> miss = new ArrayList<>();
        if (col(head, "社員番号") < 0) miss.add("社員番号");
        if (col(head, "利用日", "日付", "使用日") < 0) miss.add("利用日（日付）");
        if (col(head, "金額") < 0) miss.add("金額");
        if (col(head, "承認") < 0) miss.add("承認");
        return miss;
    }

    static int col(List<String> head, String... keys) {
        for (int i = 0; i < head.size(); i++) for (String k : keys) if (head.get(i) != null && head.get(i).contains(k)) return i;
        return -1;
    }
    private static String get(List<String> r, int i) { return i < r.size() && r.get(i) != null ? r.get(i) : ""; }
    private static boolean isTrue(String s) { s = s.trim(); return s.equalsIgnoreCase("TRUE") || s.equals("済") || s.equals("承認") || s.equals("○") || s.equals("〇"); }
    static int parseYen(String s) { String d = s.replaceAll("[^0-9]", ""); return d.isEmpty() ? 0 : Integer.parseInt(d); }
    static LocalDate parseDate(String s) {
        var m = java.util.regex.Pattern.compile("(\\d{4})[/\\-年](\\d{1,2})[/\\-月](\\d{1,2})").matcher(s);
        return m.find() ? LocalDate.of(Integer.parseInt(m.group(1)), Integer.parseInt(m.group(2)), Integer.parseInt(m.group(3))) : null;
    }
}
