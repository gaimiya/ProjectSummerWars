// 担当：横田さん（集計ルールのテスト）。変更する前に aggregate/README.md を読み、担当外の人は担当者に相談する
package app.kintai.aggregate;

import app.kintai.attendance.DayRecord;
import app.kintai.attendance.MonthSheet;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/** 集計ルールのテスト。社労士とルールを決めたら、ここに例を足してから AggregationRules を直す */
class AggregationRulesTest {
    static DayRecord day(int d, Integer in, Integer out, int brk, String note) { return new DayRecord(LocalDate.of(2026, 12, d), in, out, brk, note); }
    static int h(int hh, int mm) { return hh * 60 + mm; }

    @Test
    void 平日は標準時間を超えた分が残業() {
        var s = AggregationRules.aggregate(new MonthSheet(List.of(
                day(1, h(9, 30), h(18, 30), 60, ""),      // 8時間
                day(2, h(9, 0), h(20, 0), 60, "")),        // 10時間 → 残業2時間
                480, Set.of()));
        assertThat(s.workDays()).isEqualTo(2);
        assertThat(s.workMinutes()).isEqualTo(h(18, 0));
        assertThat(s.overtimeMinutes()).isEqualTo(h(2, 0));
    }

    @Test
    void 土曜は土曜出勤_日曜と祝日は休日出勤と休日深夜() {
        var s = AggregationRules.aggregate(new MonthSheet(List.of(
                day(5, h(10, 0), h(15, 0), 0, ""),         // 土曜 5時間
                day(6, h(20, 0), h(2, 0), 0, ""),          // 日曜 20時〜翌2時：6時間、うち深夜4時間
                day(31, h(9, 0), h(12, 0), 0, "")),        // 祝日（休日シート）3時間
                480, Set.of(LocalDate.of(2026, 12, 31))));
        assertThat(s.saturdayMinutes()).isEqualTo(h(5, 0));
        assertThat(s.holidayMinutes()).isEqualTo(h(9, 0));
        assertThat(s.holidayNightMinutes()).isEqualTo(h(4, 0));
        assertThat(s.overtimeMinutes()).isZero();
    }

    @Test
    void 平日の深夜() {
        var s = AggregationRules.aggregate(new MonthSheet(List.of(day(1, h(18, 0), h(23, 30), 30, "")), 480, Set.of()));
        assertThat(s.nightMinutes()).isEqualTo(h(1, 30));
    }

    @Test
    void 有給と特別休暇は備考から数える() {
        var s = AggregationRules.aggregate(new MonthSheet(List.of(
                day(7, null, null, 0, "有給"), day(8, null, null, 0, "有給（半休）"), day(9, null, null, 0, "夏季休暇")),
                480, Set.of()));
        assertThat(s.paidLeaveDays()).isEqualTo(1.5);
        assertThat(s.specialLeaveDays()).isEqualTo(1.0);
        assertThat(s.workDays()).isZero();
    }
}
