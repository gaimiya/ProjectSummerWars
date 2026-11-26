package app.kintai.google;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/** Google につながずに動かすための仮データ。どの勤怠シートも、平日 9:30〜18:30（休憩1時間）で入力済みとして返す */
public class FakeGoogleWorkspace implements GoogleWorkspace {
    private static final Pattern MONTH = Pattern.compile("'?(\\d{4})年(\\d{1,2})月'?!");
    private final Map<String, Set<String>> sheets = new ConcurrentHashMap<>();
    private int seq = 0;

    @Override public boolean isFake() { return true; }

    @Override
    public List<List<String>> readValues(String id, String range) {
        if (range.startsWith("A1:")) return List.of(List.of("タイムスタンプ", "社員番号", "氏名", "利用日", "金額（円）", "承認"));
        if (range.contains("休日")) return List.of();
        if (range.contains("J10")) return List.of(List.of("8:00"));
        var m = MONTH.matcher(range);
        if (!m.find()) return List.of();
        YearMonth ym = YearMonth.of(Integer.parseInt(m.group(1)), Integer.parseInt(m.group(2)));
        List<List<String>> rows = new ArrayList<>();
        for (int d = 1; d <= ym.lengthOfMonth(); d++) {
            LocalDate date = ym.atDay(d);
            boolean weekday = date.getDayOfWeek().getValue() <= 5;
            String label = date.getMonthValue() + "月" + d + "日";
            rows.add(weekday ? List.of(label, "9:30", "18:30", "1:00", "8:00", "") : List.of(label, "", "", "", "-", ""));
        }
        return rows;
    }

    @Override public List<String> sheetTitles(String id) { return new ArrayList<>(sheets.getOrDefault(id, Set.of("テンプレ"))); }
    @Override public void duplicateSheet(String id, String from, String to) {
        sheets.computeIfAbsent(id, k -> new LinkedHashSet<>(List.of("テンプレ"))).add(to);
    }
    @Override public void writeCell(String id, String range, String value) {}
    @Override public String createFolder(String name, String parent) { return "https://drive.google.com/drive/folders/" + fakeId(); }
    @Override public String copySpreadsheet(String fileId, String name, String folderId) { return "https://docs.google.com/spreadsheets/d/" + fakeId() + "/edit"; }
    @Override public void share(String fileId, String email, String role) {}
    @Override public void unshare(String fileId, String email) {}
    @Override public void moveToFolder(String fileId, String folderId) {}

    private synchronized String fakeId() { return "FAKE" + String.format("%028d", ++seq); }
}
