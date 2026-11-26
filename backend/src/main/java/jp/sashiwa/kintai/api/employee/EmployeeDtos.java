package jp.sashiwa.kintai.api.employee;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;

/** 画面とやり取りする形（Entity をそのまま返さない） */
public final class EmployeeDtos {
    private EmployeeDtos() {}

    /** 一覧の1行 */
    public record EmployeeSummary(String no, String name, String kana, String dept, String type,
                                  LocalDate joined, String status, int housing, String shareState) {}

    /** 詳細 */
    public record EmployeeDetail(String no, String name, String kana, String mail, String dept, String type,
                                 LocalDate joined, String status, String payType, int base, String stdTime,
                                 int commute, int housing, int fixed, String fixedName,
                                 String sheetUrl, String folderUrl, String shareState,
                                 List<Assignment> history) {}

    public record Assignment(@NotBlank(message = "案件名を入力してください") String project,
                             @PositiveOrZero(message = "インセンティブは0以上で入力してください") int amount,
                             LocalDate from, LocalDate to) {}

    /** 登録・変更の入力 */
    public record EmployeeForm(
            @NotBlank(message = "社員番号を入力してください")
            @Size(max = 10, message = "社員番号は10文字以内です") String no,
            @NotBlank(message = "氏名を入力してください") @Size(max = 50) String name,
            @Size(max = 50) String kana,
            @NotBlank(message = "メールアドレスを入力してください")
            @Email(message = "メールアドレスの形が正しくありません") String mail,
            @Size(max = 50) String dept,
            @Pattern(regexp = "正社員|契約社員|パート・アルバイト", message = "雇用形態を選んでください") String type,
            @NotNull(message = "入社日を入力してください") LocalDate joined,
            @Pattern(regexp = "在籍|休職", message = "在籍を選んでください") String status,
            @Pattern(regexp = "月給|日給|時給", message = "給与形態を選んでください") String payType,
            @PositiveOrZero(message = "基本給は0以上で入力してください") Integer base,
            @Pattern(regexp = "^\\d{1,2}:\\d{2}$", message = "標準時間は 8:00 の形で入力してください") String stdTime,
            @PositiveOrZero(message = "通勤手当は0以上で入力してください") Integer commute,
            @PositiveOrZero(message = "住宅手当は0以上で入力してください") Integer housing,
            @PositiveOrZero(message = "固定手当は0以上で入力してください") Integer fixed,
            @Size(max = 50) String fixedName,
            List<@Valid Assignment> history) {}

    /** 結果メッセージ */
    public record Result(String message, String no) {}
}
