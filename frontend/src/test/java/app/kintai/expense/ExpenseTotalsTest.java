package app.kintai.expense;

import org.junit.jupiter.api.Test;

import java.time.YearMonth;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ExpenseTotalsTest {
    @Test
    void 承認済みでその月の分だけ社員番号ごとに合計する() {
        var rows = List.of(
                List.of("タイムスタンプ", "社員番号", "利用日", "金額（円）", "承認"),
                List.of("x", "e0001", "2026/12/03", "1,200", "TRUE"),
                List.of("x", "E0001", "2026/12/04", "800", "FALSE"),
                List.of("x", "E0001", "2026/11/30", "500", "TRUE"),
                List.of("x", "E0002", "2026-12-10", "300", "TRUE"));
        var sum = ExpenseTotals.sum(rows, YearMonth.of(2026, 12));
        assertThat(sum).containsEntry("E0001", 1200).containsEntry("E0002", 300).hasSize(2);
    }

    @Test
    void 足りない列を知らせる() {
        assertThat(ExpenseTotals.missingHeaders(List.of("社員番号", "金額"))).containsExactly("利用日（日付）", "承認");
    }
}
