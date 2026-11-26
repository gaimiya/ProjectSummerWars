// 担当：宮谷さん（社員管理のテスト）。変更する前に employee/README.md を読み、担当外の人は担当者に相談する
package app.kintai.employee;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EmployeeImportTest {
    @Test
    void GAS版の社員一覧と参画履歴を読む_退職者は飛ばす() {
        var emp = List.of(
                List.of("社員番号", "氏名", "フリガナ", "メール", "所属", "雇用形態", "入社日", "在籍", "給与形態", "基本給", "標準時間",
                        "通勤手当", "住宅手当", "固定手当", "固定手当名", "勤怠シートURL", "個人フォルダURL", "共有状態", "登録日時", "更新日時", "削除日時"),
                List.of("E0001", "山田 太郎", "ヤマダ タロウ", "taro@example.com", "開発部", "正社員", "2025/4/1", "在籍", "月給", "250,000", "8:00",
                        "10,000", "10,000", "0", "", "https://docs.google.com/spreadsheets/d/AAAAAAAAAAAAAAAAAAAAAAAAAAAA/edit", "", "共有済み", "", "", ""),
                List.of("E0002", "退職 次郎", "", "jiro@example.com", "", "", "2024/1/1", "在籍", "", "", "", "", "", "", "", "", "", "共有停止", "", "", "2026/3/31"));
        var hist = List.of(List.of("社員番号", "案件", "インセンティブ月額", "参画開始", "参画終了"),
                List.of("E0001", "案件A", "30000", "2026/04/01", ""));
        var rows = EmployeeImport.parse(emp, hist);
        assertThat(rows).hasSize(1);
        var f = rows.get(0).form();
        assertThat(f.getJoined()).isEqualTo(LocalDate.of(2025, 4, 1));
        assertThat(f.getBase()).isEqualTo(250000);
        assertThat(f.getHistory()).hasSize(1);
        assertThat(f.getHistory().get(0).getAmount()).isEqualTo(30000);
        assertThat(rows.get(0).shareState()).isEqualTo("共有済み");
    }
}
