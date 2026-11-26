package app.kintai.monthly;

import app.kintai.common.TimeText;

import java.util.List;

/** 月次集計の列（画面の表・社労士へのCSVで共通）。列を足すときは HEADER と row を同じ順番で足す */
public final class MonthlyColumns {
    private MonthlyColumns() {}

    public static final List<String> HEADER = List.of("対象月", "社員番号", "氏名", "所属", "雇用形態", "給与形態", "基本給", "標準時間",
            "出勤日数", "総労働時間", "残業", "深夜", "土曜出勤", "休日出勤", "休日深夜", "有給（日）", "特別休暇（日）",
            "通勤手当", "住宅手当", "固定手当", "固定手当名", "インセンティブ", "インセンティブ内訳", "交通費精算", "経費精算", "状態");

    public static List<String> row(MonthlyRecord r) {
        return List.of(r.getTargetMonth(), r.getEmployeeNo(), s(r.getEmployeeName()), s(r.getDepartment()), s(r.getEmploymentType()),
                s(r.getPayType()), n(r.getBaseSalary()), TimeText.format(r.getStandardMinutes()),
                n(r.getWorkDays()), TimeText.format(r.getWorkMinutes()), TimeText.format(r.getOvertimeMinutes()),
                TimeText.format(r.getNightMinutes()), TimeText.format(r.getSaturdayMinutes()), TimeText.format(r.getHolidayMinutes()),
                TimeText.format(r.getHolidayNightMinutes()), d(r.getPaidLeaveDays()), d(r.getSpecialLeaveDays()),
                n(r.getCommuteAllowance()), n(r.getHousingAllowance()), n(r.getFixedAllowance()), s(r.getFixedAllowanceName()),
                n(r.getIncentive()), s(r.getIncentiveDetail()), n(r.getTransportExpense()), n(r.getOtherExpense()), s(r.getStatus()));
    }

    private static String s(String v) { return v == null ? "" : v; }
    private static String n(int v) { return String.valueOf(v); }
    private static String d(double v) { return v == Math.floor(v) ? String.valueOf((int) v) : String.valueOf(v); }
}
