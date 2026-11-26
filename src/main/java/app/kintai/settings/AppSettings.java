package app.kintai.settings;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 画面「設定」で変えられる値（テーブル app_setting）。コードにURLやメールアドレスを書かないためのもの。
 */
@Service
public class AppSettings {
    public static final String TEMPLATE_SHEET = "TEMPLATE_SHEET_URL";       // 勤怠表_ひな型
    public static final String ROOT_FOLDER = "ROOT_FOLDER_URL";             // 社員フォルダを作る親フォルダ
    public static final String RETIRED_FOLDER = "RETIRED_FOLDER_URL";       // 退職者フォルダ
    public static final String MAIL_TO = "MAIL_TO";                         // 社労士のメールアドレス
    public static final String TRANSPORT_SHEET = "FORM_TRANSPORT_SHEET_URL"; // 交通費フォームの回答シート
    public static final String EXPENSE_SHEET = "FORM_EXPENSE_SHEET_URL";     // 経費フォームの回答シート
    public static final String TRANSPORT_FORM = "FORM_TRANSPORT_URL";       // 交通費フォーム（社員に配るURL）
    public static final String EXPENSE_FORM = "FORM_EXPENSE_URL";           // 経費フォーム（社員に配るURL）
    public static final List<String> KEYS = List.of(TEMPLATE_SHEET, ROOT_FOLDER, RETIRED_FOLDER, MAIL_TO,
            TRANSPORT_FORM, TRANSPORT_SHEET, EXPENSE_FORM, EXPENSE_SHEET);

    private final JdbcTemplate jdbc;
    public AppSettings(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public String get(String key) {
        List<String> v = jdbc.queryForList("SELECT setting_value FROM app_setting WHERE setting_key = ?", String.class, key);
        return v.isEmpty() ? "" : v.get(0);
    }

    @Transactional
    public void set(String key, String value) {
        jdbc.update("DELETE FROM app_setting WHERE setting_key = ?", key);
        String v = value == null ? "" : value.trim();
        if (!v.isEmpty()) jdbc.update("INSERT INTO app_setting (setting_key, setting_value) VALUES (?, ?)", key, v);
    }
}
