// 担当：山川さん（月次集計・社労士への送付）。変更する前に同じフォルダか担当フォルダの README.md を読み、担当外の人は担当者に相談する
package app.kintai.monthly;

import app.kintai.aggregate.AggregationRules;
import app.kintai.aggregate.MonthlySummary;
import app.kintai.attendance.AttendanceReader;
import app.kintai.attendance.MonthSheet;
import app.kintai.employee.Employee;
import app.kintai.employee.EmployeeRepository;
import app.kintai.employee.ProjectAssignment;
import app.kintai.expense.ExpenseService;
import app.kintai.settings.AppSettings;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;

/**
 * 月次集計：全員の勤怠シートを読み → チェック → 計算（AggregationRules）→ 手当・インセンティブ・交通費・経費を足して保存。
 * 確定した月は集計し直さない。
 */
@Service
public class MonthlyService {
    private final EmployeeRepository employees;
    private final MonthlyRecordRepository records;
    private final AttendanceReader reader;
    private final ExpenseService expenses;
    private final AppSettings settings;
    private final ObjectProvider<JavaMailSender> mail;

    public MonthlyService(EmployeeRepository employees, MonthlyRecordRepository records, AttendanceReader reader,
                          ExpenseService expenses, AppSettings settings, ObjectProvider<JavaMailSender> mail) {
        this.employees = employees; this.records = records; this.reader = reader;
        this.expenses = expenses; this.settings = settings; this.mail = mail;
    }

    public record CollectResult(List<String> ok, List<String> ng) {}

    @Transactional(readOnly = true)
    public List<MonthlyRecord> list(YearMonth ym) { return records.findByTargetMonthOrderByEmployeeNo(ym.toString()); }

    @Transactional
    public CollectResult collect(YearMonth ym) {
        List<String> ok = new ArrayList<>(), ng = new ArrayList<>(), common = new ArrayList<>();
        Map<String, Integer> transport = expenses.transport(ym, common), other = expenses.other(ym, common);
        ng.addAll(common);
        for (Employee e : employees.findByDeletedAtIsNullOrderByEmployeeNo()) {
            if (e.getSheetUrl() == null) { ng.add(e.getName() + "：勤怠シートが未登録です"); continue; }
            MonthlyRecord r = records.findByTargetMonthAndEmployeeNo(ym.toString(), e.getEmployeeNo())
                    .orElseGet(() -> new MonthlyRecord(ym.toString(), e.getEmployeeNo()));
            if (MonthlyRecord.FIXED.equals(r.getStatus())) { ng.add(e.getName() + "：確定済みのため集計し直していません"); continue; }
            List<String> errors = new ArrayList<>();
            MonthSheet sheet;
            try { sheet = reader.read(e.getSheetUrl(), ym, errors); }
            catch (RuntimeException ex) { ng.add(e.getName() + "：勤怠シートを開けません（" + ex.getMessage() + "）"); continue; }
            if (sheet == null) { ng.add(e.getName() + "：「" + AttendanceReader.sheetTitle(ym) + "」シートがありません"); continue; }
            if (!errors.isEmpty()) { ng.add(e.getName() + "：入力エラー " + errors.size() + "件（" + String.join(" ／ ", errors.subList(0, Math.min(3, errors.size()))) + "）"); continue; }

            fill(r, e, AggregationRules.aggregate(sheet), ym);
            String key = e.getEmployeeNo().toUpperCase();
            r.setTransportExpense(transport.getOrDefault(key, 0));
            r.setOtherExpense(other.getOrDefault(key, 0));
            records.save(r);
            ok.add(e.getName());
        }
        return new CollectResult(ok, ng);
    }

    /** 確定（社労士へ送ったあとに押す。確定した月は集計し直さない） */
    @Transactional
    public void fix(YearMonth ym) { list(ym).forEach(r -> r.setStatus(MonthlyRecord.FIXED)); }

    @Transactional(readOnly = true)
    public String csv(YearMonth ym) {
        return CsvExporter.toCsv(MonthlyColumns.HEADER, list(ym).stream().map(MonthlyColumns::row).toList());
    }

    /** 社労士へCSVを送る（環境変数 SPRING_MAIL_HOST などと、「設定」画面の社労士メールが必要） */
    @Transactional(readOnly = true)
    public String sendCsv(YearMonth ym) throws Exception {
        String to = settings.get(AppSettings.MAIL_TO);
        if (to.isEmpty()) throw new IllegalStateException("「設定」で社労士のメールアドレスを入れてください");
        JavaMailSender sender = mail.getIfAvailable();
        if (sender == null) throw new IllegalStateException("メール送信の設定（SPRING_MAIL_HOST など）がありません。CSVをダウンロードして送ってください");
        int n = list(ym).size();
        if (n == 0) throw new IllegalStateException(ym + " の月次集計がまだありません");
        var msg = sender.createMimeMessage();
        var h = new MimeMessageHelper(msg, true, "UTF-8");
        h.setTo(to);
        h.setSubject("【勤怠集計】" + ym + "分（" + n + "名）");
        h.setText("いつもお世話になっております。\n" + ym + " 分の勤怠集計を送付いたします。\n給与計算をよろしくお願いいたします。\n\n添付：勤怠集計_" + ym + ".csv（" + n + "名分）");
        h.addAttachment("勤怠集計_" + ym + ".csv", new ByteArrayResource(csv(ym).getBytes(StandardCharsets.UTF_8)), "text/csv");
        sender.send(msg);
        return to + " へ " + ym + " 分（" + n + "名）を送りました。";
    }

    private void fill(MonthlyRecord r, Employee e, MonthlySummary s, YearMonth ym) {
        r.setEmployeeName(e.getName()); r.setDepartment(e.getDepartment()); r.setEmploymentType(e.getEmploymentType());
        r.setPayType(e.getPayType()); r.setBaseSalary(e.getBaseSalary()); r.setStandardMinutes(e.getStandardMinutes());
        r.setWorkDays(s.workDays()); r.setWorkMinutes(s.workMinutes()); r.setOvertimeMinutes(s.overtimeMinutes());
        r.setNightMinutes(s.nightMinutes()); r.setSaturdayMinutes(s.saturdayMinutes()); r.setHolidayMinutes(s.holidayMinutes());
        r.setHolidayNightMinutes(s.holidayNightMinutes()); r.setPaidLeaveDays(s.paidLeaveDays()); r.setSpecialLeaveDays(s.specialLeaveDays());
        r.setCommuteAllowance(e.getCommuteAllowance()); r.setHousingAllowance(e.getHousingAllowance());
        r.setFixedAllowance(e.getFixedAllowance()); r.setFixedAllowanceName(e.getFixedAllowanceName());
        // その月に参画していた案件のインセンティブ
        LocalDate first = ym.atDay(1), last = ym.atEndOfMonth();
        List<ProjectAssignment> active = e.getAssignments().stream()
                .filter(a -> (a.getStartOn() == null || !a.getStartOn().isAfter(last)) && (a.getEndOn() == null || !a.getEndOn().isBefore(first))).toList();
        r.setIncentive(active.stream().mapToInt(ProjectAssignment::getIncentive).sum());
        r.setIncentiveDetail(String.join("、", active.stream().map(a -> a.getProjectName() + " " + String.format("%,d", a.getIncentive()) + "円").toList()));
        r.setStatus(MonthlyRecord.COLLECTED);
        r.setCollectedAt(LocalDateTime.now());
        r.setCollectCount(r.getCollectCount() + 1);
        r.setSheetUrl(e.getSheetUrl());
    }
}
