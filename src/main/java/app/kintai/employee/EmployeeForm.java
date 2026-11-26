package app.kintai.employee;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** 社員の登録・変更画面の入力（画面の name と同じ名前） */
public class EmployeeForm {
    @NotBlank(message = "社員番号を入力してください") @Size(max = 10, message = "社員番号は10文字以内です")
    private String no;
    @NotBlank(message = "氏名を入力してください") @Size(max = 50) private String name;
    @Size(max = 50) private String kana;
    @NotBlank(message = "メールアドレスを入力してください") @Email(message = "メールアドレスの形が正しくありません")
    private String mail;
    @Size(max = 50) private String dept;
    @Pattern(regexp = "正社員|契約社員|パート・アルバイト") private String type = "正社員";
    @NotNull(message = "入社日を入力してください") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) private LocalDate joined;
    @Pattern(regexp = "在籍|休職") private String status = "在籍";
    @Pattern(regexp = "月給|日給|時給") private String payType = "月給";
    @PositiveOrZero(message = "基本給は0以上で入力してください") private Integer base = 0;
    @jakarta.validation.constraints.Pattern(regexp = "^\\d{1,2}:\\d{2}$", message = "標準時間は 8:00 の形で入力してください")
    private String stdTime = "8:00";
    @PositiveOrZero(message = "通勤手当は0以上で入力してください") private Integer commute = 0;
    @PositiveOrZero(message = "住宅手当は0以上で入力してください") private Integer housing = 0;
    @PositiveOrZero(message = "固定手当は0以上で入力してください") private Integer fixed = 0;
    @Size(max = 50) private String fixedName;
    /** 既存の勤怠シートを使うときのURL（新規で空なら、ひな型から作る） */
    @Size(max = 255) @jakarta.validation.constraints.Pattern(regexp = "^$|^https://docs\\.google\\.com/spreadsheets/.*", message = "GoogleスプレッドシートのURLを入力してください")
    private String sheetUrl = "";
    @Size(max = 255) @jakarta.validation.constraints.Pattern(regexp = "^$|^https://drive\\.google\\.com/.*", message = "GoogleドライブのフォルダURLを入力してください")
    private String folderUrl = "";
    @Valid private List<AssignmentForm> history = new ArrayList<>();

    /** 案件・参画履歴の1行（案件名が空の行は保存しない） */
    public static class AssignmentForm {
        private String project;
        @PositiveOrZero(message = "インセンティブは0以上で入力してください") private Integer amount = 0;
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) private LocalDate from;
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) private LocalDate to;
        public AssignmentForm() {}
        public AssignmentForm(String project, Integer amount, LocalDate from, LocalDate to) { this.project = project; this.amount = amount; this.from = from; this.to = to; }
        public String getProject() { return project; } public void setProject(String v) { project = v; }
        public Integer getAmount() { return amount; } public void setAmount(Integer v) { amount = v; }
        public LocalDate getFrom() { return from; } public void setFrom(LocalDate v) { from = v; }
        public LocalDate getTo() { return to; } public void setTo(LocalDate v) { to = v; }
    }

    /** 画面に空の行を足しておく（入力欄を増やすためのJSを使わない） */
    public EmployeeForm withBlankRows(int n) { for (int i = 0; i < n; i++) history.add(new AssignmentForm()); return this; }

    public String getNo() { return no; } public void setNo(String v) { no = v; }
    public String getName() { return name; } public void setName(String v) { name = v; }
    public String getKana() { return kana; } public void setKana(String v) { kana = v; }
    public String getMail() { return mail; } public void setMail(String v) { mail = v; }
    public String getDept() { return dept; } public void setDept(String v) { dept = v; }
    public String getType() { return type; } public void setType(String v) { type = v; }
    public LocalDate getJoined() { return joined; } public void setJoined(LocalDate v) { joined = v; }
    public String getStatus() { return status; } public void setStatus(String v) { status = v; }
    public String getPayType() { return payType; } public void setPayType(String v) { payType = v; }
    public Integer getBase() { return base; } public void setBase(Integer v) { base = v; }
    public String getStdTime() { return stdTime; } public void setStdTime(String v) { stdTime = v; }
    public Integer getCommute() { return commute; } public void setCommute(Integer v) { commute = v; }
    public Integer getHousing() { return housing; } public void setHousing(Integer v) { housing = v; }
    public Integer getFixed() { return fixed; } public void setFixed(Integer v) { fixed = v; }
    public String getFixedName() { return fixedName; } public void setFixedName(String v) { fixedName = v; }
    public String getSheetUrl() { return sheetUrl; } public void setSheetUrl(String v) { sheetUrl = v; }
    public String getFolderUrl() { return folderUrl; } public void setFolderUrl(String v) { folderUrl = v; }
    public List<AssignmentForm> getHistory() { return history; } public void setHistory(List<AssignmentForm> v) { history = v; }
}
