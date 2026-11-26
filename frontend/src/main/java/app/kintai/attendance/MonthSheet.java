package app.kintai.attendance;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/** 勤怠シートの「YYYY年MM月」シート1枚分（日ごとの勤怠・標準時間・休日） */
public record MonthSheet(List<DayRecord> days, int standardMinutes, Set<LocalDate> holidays) {}
