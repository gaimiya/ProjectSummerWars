package app.kintai.attendance;

import app.kintai.common.TimeText;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.regex.Pattern;

/**
 * 勤怠シートの表示どおりの文字（Sheets API の FORMATTED_VALUE）を読み取る。
 * 行：B〜G（B日付・C出勤・D退勤・E休憩・F勤務時間・G備考）の 11〜41 行目。
 * 日付は「12月1日 (火)」「2026/12/01」どちらでも読める。
 */
public final class MonthSheetParser {
    private static final Pattern MD = Pattern.compile("(\\d{1,2})月(\\d{1,2})日");
    private static final Pattern YMD = Pattern.compile("(\\d{4})[/\\-年](\\d{1,2})[/\\-月](\\d{1,2})");
    private MonthSheetParser() {}

    /** rows：B11:G41 の値。入力の形が正しくない日は errors に入れる */
    public static MonthSheet parse(YearMonth ym, List<List<String>> rows, String standardTime,
                                   List<List<String>> holidayRows, List<String> errors) {
        List<DayRecord> days = new ArrayList<>();
        for (List<String> r : rows) {
            LocalDate date = date(ym, cell(r, 0));
            if (date == null) continue;                       // 月末の空行など
            String in = cell(r, 1), out = cell(r, 2), brk = cell(r, 3), note = cell(r, 5);
            String label = date.getMonthValue() + "/" + date.getDayOfMonth();
            boolean hasIn = !in.isBlank(), hasOut = !out.isBlank();
            if (hasIn != hasOut) { errors.add(label + "：出勤と退勤の片方だけ入力されています"); continue; }
            if (!hasIn) { days.add(new DayRecord(date, null, null, 0, note)); continue; }
            Integer a = TimeText.toMinutes(in), b = TimeText.toMinutes(out);
            Integer br = brk.isBlank() ? Integer.valueOf(0) : TimeText.toMinutes(brk);
            if (a == null || b == null || br == null) { errors.add(label + "：時刻は 9:30 の形で入力してください"); continue; }
            int span = (b <= a ? b + 1440 : b) - a;
            if (br >= span) { errors.add(label + "：休憩が勤務時間以上です"); continue; }
            days.add(new DayRecord(date, a, b, br, note));
        }
        Integer std = TimeText.toMinutes(standardTime);
        Set<LocalDate> holidays = new HashSet<>();
        if (holidayRows != null) for (List<String> r : holidayRows) {
            LocalDate d = date(null, cell(r, 0));
            if (d != null) holidays.add(d);
        }
        return new MonthSheet(days, std == null ? 480 : std, holidays);
    }

    static LocalDate date(YearMonth ym, String s) {
        if (s == null || s.isBlank()) return null;
        var m = YMD.matcher(s);
        if (m.find()) return LocalDate.of(Integer.parseInt(m.group(1)), Integer.parseInt(m.group(2)), Integer.parseInt(m.group(3)));
        m = MD.matcher(s);
        if (m.find() && ym != null) {
            int month = Integer.parseInt(m.group(1));
            int year = month < ym.getMonthValue() ? ym.getYear() + 1 : ym.getYear();
            return LocalDate.of(year, month, Integer.parseInt(m.group(2)));
        }
        return null;
    }

    private static String cell(List<String> r, int i) { return r != null && i < r.size() && r.get(i) != null ? r.get(i).trim() : ""; }
}
