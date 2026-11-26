package app.kintai.attendance;

import java.time.LocalDate;

/**
 * 勤怠シートの1日分。時刻は分（9:30 → 570）。入力がなければ clockIn・clockOut は null。
 * 退勤が出勤以前なら日またぎ（夜勤）として扱う。
 */
public record DayRecord(LocalDate date, Integer clockIn, Integer clockOut, int breakMinutes, String note) {
    public boolean worked() { return clockIn != null && clockOut != null; }
}
