// 担当：横田さん（勤怠シートの読み取り）。変更する前に同じフォルダか担当フォルダの README.md を読み、担当外の人は担当者に相談する
package app.kintai.attendance;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/** 勤怠シートの「YYYY年MM月」シート1枚分（日ごとの勤怠・標準時間・休日） */
public record MonthSheet(List<DayRecord> days, int standardMinutes, Set<LocalDate> holidays) {}
