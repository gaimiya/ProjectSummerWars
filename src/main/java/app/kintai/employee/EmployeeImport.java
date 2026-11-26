// 担当：宮谷さん（社員管理）。変更する前に同じフォルダか担当フォルダの README.md を読み、担当外の人は担当者に相談する
package app.kintai.employee;

import java.time.LocalDate;
import java.util.*;
import java.util.regex.Pattern;

/**
 * GAS 版の「社員管理表」（シート「社員一覧」「参画履歴」）を読み取って、登録用の形にする（切り替え用・1回だけ使う）。
 * 見出しの名前で列を探すので、列の順番が違っても読める。削除日時が入っている社員（退職者）は取り込まない。
 */
public final class EmployeeImport {
    private EmployeeImport() {}

    /** 取り込む1人分（共有状態は GAS 版のものを引き継ぐ） */
    public record Row(EmployeeForm form, String shareState) {}

    public static List<Row> parse(List<List<String>> employees, List<List<String>> history) {
        List<Row> out = new ArrayList<>();
        if (employees == null || employees.size() < 2) return out;
        Map<String, Integer> c = index(employees.get(0));
        Map<String, List<EmployeeForm.AssignmentForm>> hist = history(history);
        for (List<String> r : employees.subList(1, employees.size())) {
            String no = get(r, c, "社員番号");
            if (no.isEmpty() || !get(r, c, "削除日時").isEmpty()) continue;
            EmployeeForm f = new EmployeeForm();
            f.setNo(no); f.setName(get(r, c, "氏名")); f.setKana(get(r, c, "フリガナ")); f.setMail(get(r, c, "メール"));
            f.setDept(get(r, c, "所属")); f.setType(or(get(r, c, "雇用形態"), "正社員")); f.setJoined(date(get(r, c, "入社日")));
            f.setStatus(or(get(r, c, "在籍"), "在籍")); f.setPayType(or(get(r, c, "給与形態"), "月給"));
            f.setBase(yen(get(r, c, "基本給"))); f.setStdTime(or(time(get(r, c, "標準時間")), "8:00"));
            f.setCommute(yen(get(r, c, "通勤手当"))); f.setHousing(yen(get(r, c, "住宅手当"))); f.setFixed(yen(get(r, c, "固定手当")));
            f.setFixedName(get(r, c, "固定手当名"));
            f.setSheetUrl(get(r, c, "勤怠シートURL")); f.setFolderUrl(get(r, c, "個人フォルダURL"));
            f.setHistory(new ArrayList<>(hist.getOrDefault(no, List.of())));
            String share = get(r, c, "共有状態");
            out.add(new Row(f, share.isEmpty() ? (f.getSheetUrl().isEmpty() ? "未作成" : "入社日に共有予定") : share));
        }
        return out;
    }

    private static Map<String, List<EmployeeForm.AssignmentForm>> history(List<List<String>> rows) {
        Map<String, List<EmployeeForm.AssignmentForm>> m = new HashMap<>();
        if (rows == null || rows.size() < 2) return m;
        Map<String, Integer> c = index(rows.get(0));
        for (List<String> r : rows.subList(1, rows.size())) {
            String no = get(r, c, "社員番号"), project = get(r, c, "案件");
            if (no.isEmpty() || project.isEmpty()) continue;
            m.computeIfAbsent(no, k -> new ArrayList<>()).add(new EmployeeForm.AssignmentForm(project,
                    yen(get(r, c, "インセンティブ")), date(get(r, c, "参画開始")), date(get(r, c, "参画終了"))));
        }
        return m;
    }

    private static Map<String, Integer> index(List<String> head) {
        Map<String, Integer> m = new HashMap<>();
        for (int i = 0; i < head.size(); i++) m.putIfAbsent(head.get(i).trim(), i);
        return m;
    }

    /** 見出しが完全に同じ列、なければ見出しに名前を含む列 */
    private static String get(List<String> r, Map<String, Integer> c, String name) {
        Integer i = c.get(name);
        if (i == null) i = c.entrySet().stream().filter(e -> e.getKey().contains(name)).map(Map.Entry::getValue).findFirst().orElse(null);
        return i == null || i >= r.size() || r.get(i) == null ? "" : r.get(i).trim();
    }

    private static String or(String v, String def) { return v.isEmpty() ? def : v; }
    static int yen(String s) { String d = s.replaceAll("[^0-9]", ""); return d.isEmpty() ? 0 : Integer.parseInt(d); }
    static String time(String s) { var m = Pattern.compile("(\\d{1,2}):(\\d{2})").matcher(s); return m.find() ? Integer.parseInt(m.group(1)) + ":" + m.group(2) : ""; }
    static LocalDate date(String s) {
        var m = Pattern.compile("(\\d{4})[/\\-年](\\d{1,2})[/\\-月](\\d{1,2})").matcher(s);
        return m.find() ? LocalDate.of(Integer.parseInt(m.group(1)), Integer.parseInt(m.group(2)), Integer.parseInt(m.group(3))) : null;
    }
}
