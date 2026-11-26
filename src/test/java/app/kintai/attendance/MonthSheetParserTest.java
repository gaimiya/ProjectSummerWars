// 担当：横田さん（勤怠シート読み取りのテスト）。変更する前に attendance/README.md を読み、担当外の人は担当者に相談する
package app.kintai.attendance;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class MonthSheetParserTest {
    @Test
    void 勤怠シートの表示どおりの文字を読む() {
        List<String> errors = new ArrayList<>();
        var sheet = MonthSheetParser.parse(YearMonth.of(2026, 12), List.of(
                List.of("12月1日 (火)", "9:30", "18:30", "1:00", "8:00", ""),
                List.of("12月2日 (水)", "", "", "", "-", "有給"),
                List.of("12月3日 (木)", "9:00", "", "", "", ""),
                List.of("12月4日 (金)", "9時", "18:00", "", "", ""),
                List.of("", "")), "8:00", List.of(List.of("2026/12/31")), errors);
        assertThat(sheet.days()).hasSize(2);
        assertThat(sheet.days().get(0).clockIn()).isEqualTo(570);
        assertThat(sheet.days().get(1).note()).isEqualTo("有給");
        assertThat(sheet.holidays()).containsExactly(LocalDate.of(2026, 12, 31));
        assertThat(errors).hasSize(2);
    }
}
