package app.kintai.attendance;

import app.kintai.common.Ids;
import app.kintai.google.GoogleWorkspace;
import org.springframework.stereotype.Component;

import java.time.YearMonth;
import java.util.List;

/** 社員の勤怠シート（Google スプレッドシート）から、月のシートを読む */
@Component
public class AttendanceReader {
    private final GoogleWorkspace google;
    public AttendanceReader(GoogleWorkspace google) { this.google = google; }

    /** 月のシート名（「2026年12月」。古いシートは「2026年1月」の形もある） */
    public static String sheetTitle(YearMonth ym) { return ym.getYear() + "年" + String.format("%02d", ym.getMonthValue()) + "月"; }

    /** シートがなければ null。入力の誤りは errors に入れる */
    public MonthSheet read(String sheetUrl, YearMonth ym, List<String> errors) {
        String id = Ids.of(sheetUrl);
        List<String> titles = google.sheetTitles(id);
        String title = sheetTitle(ym);
        if (!titles.contains(title)) {
            title = ym.getYear() + "年" + ym.getMonthValue() + "月";
            if (!titles.contains(title)) return null;
        }
        String q = "'" + title + "'!";
        List<List<String>> rows = google.readValues(id, q + "B11:G41");
        List<List<String>> std = google.readValues(id, q + "J10");
        List<List<String>> holidays = titles.contains("休日") ? google.readValues(id, "'休日'!A2:A") : List.of();
        String stdText = std.isEmpty() || std.get(0).isEmpty() ? "" : std.get(0).get(0);
        return MonthSheetParser.parse(ym, rows, stdText, holidays, errors);
    }
}
