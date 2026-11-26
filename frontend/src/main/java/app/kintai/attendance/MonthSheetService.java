package app.kintai.attendance;

import app.kintai.common.Ids;
import app.kintai.employee.Employee;
import app.kintai.employee.EmployeeRepository;
import app.kintai.google.GoogleWorkspace;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

/** 全員の勤怠シートに「YYYY年MM月」のシートを作る（「テンプレ」シートを複製して、G6 に年月を入れる） */
@Service
public class MonthSheetService {
    private final EmployeeRepository employees;
    private final GoogleWorkspace google;

    public MonthSheetService(EmployeeRepository employees, GoogleWorkspace google) { this.employees = employees; this.google = google; }

    public record Result(List<String> made, List<String> skipped, List<String> failed) {}

    @Transactional(readOnly = true)
    public Result createForAll(YearMonth ym) {
        List<String> made = new ArrayList<>(), skipped = new ArrayList<>(), failed = new ArrayList<>();
        String title = AttendanceReader.sheetTitle(ym);
        for (Employee e : employees.findByDeletedAtIsNullOrderByEmployeeNo()) {
            if (e.getSheetUrl() == null) { failed.add(e.getName() + "：勤怠シートが未登録"); continue; }
            try {
                String id = Ids.of(e.getSheetUrl());
                List<String> titles = google.sheetTitles(id);
                if (titles.contains(title) || titles.contains(ym.getYear() + "年" + ym.getMonthValue() + "月")) { skipped.add(e.getName()); continue; }
                google.duplicateSheet(id, "テンプレ", title);
                google.writeCell(id, "'" + title + "'!G6", "=DATE(" + ym.getYear() + "," + ym.getMonthValue() + ",1)");
                made.add(e.getName());
            } catch (RuntimeException ex) {
                failed.add(e.getName() + "：" + ex.getMessage());
            }
        }
        return new Result(made, skipped, failed);
    }
}
