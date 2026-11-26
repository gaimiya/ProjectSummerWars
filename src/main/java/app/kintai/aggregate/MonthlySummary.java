// 担当：横田さん（集計ルール）。変更する前に同じフォルダか担当フォルダの README.md を読み、担当外の人は担当者に相談する
package app.kintai.aggregate;

/** 1人1か月の集計結果。時間はすべて分。 */
public record MonthlySummary(int workDays, int workMinutes, int overtimeMinutes, int nightMinutes,
                             int saturdayMinutes, int holidayMinutes, int holidayNightMinutes,
                             double paidLeaveDays, double specialLeaveDays) {}
