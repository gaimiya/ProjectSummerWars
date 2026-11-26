package app.kintai.aggregate;

/** 1人1か月の集計結果。時間はすべて分。 */
public record MonthlySummary(int workDays, int workMinutes, int overtimeMinutes, int nightMinutes,
                             int saturdayMinutes, int holidayMinutes, int holidayNightMinutes,
                             double paidLeaveDays, double specialLeaveDays) {}
