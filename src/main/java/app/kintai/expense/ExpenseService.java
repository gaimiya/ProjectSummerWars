// 担当：山川さん（交通費・経費）。変更する前に同じフォルダか担当フォルダの README.md を読み、担当外の人は担当者に相談する
package app.kintai.expense;

import app.kintai.common.Ids;
import app.kintai.google.GoogleWorkspace;
import app.kintai.settings.AppSettings;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.util.List;
import java.util.Map;

/** 交通費・経費フォームの回答シートから、承認済みの金額を社員番号ごとに合計する */
@Service
public class ExpenseService {
    private final GoogleWorkspace google;
    private final AppSettings settings;

    public ExpenseService(GoogleWorkspace google, AppSettings settings) { this.google = google; this.settings = settings; }

    public Map<String, Integer> transport(YearMonth ym, List<String> errors) { return read(AppSettings.TRANSPORT_SHEET, "交通費", ym, errors); }
    public Map<String, Integer> other(YearMonth ym, List<String> errors) { return read(AppSettings.EXPENSE_SHEET, "経費", ym, errors); }

    private Map<String, Integer> read(String key, String label, YearMonth ym, List<String> errors) {
        String id = Ids.of(settings.get(key));
        if (id == null) return Map.of();
        try {
            String first = google.sheetTitles(id).get(0);   // フォームの回答は先頭のシートに入る
            return ExpenseTotals.sum(google.readValues(id, "'" + first + "'!A1:Z"), ym);
        } catch (RuntimeException e) {
            errors.add(label + "の回答シートを読めませんでした（" + e.getMessage() + "）");
            return Map.of();
        }
    }
}
