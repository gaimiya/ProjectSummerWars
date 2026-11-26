package jp.sashiwa.kintai.api.settings;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 交通費・経費の Google フォームのURLを登録・変更する。
 * 既存のフォームを使うときは、そのURLを登録するだけ（回答の取り込みは社員管理表側で行う）。
 */
@RestController
@RequestMapping("/api/settings/forms")
public class FormSettingController {
    static final Map<String, String> TITLES = Map.of("TRANSPORT", "交通費申請", "EXPENSE", "経費申請");
    private final JdbcTemplate jdbc;

    public FormSettingController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public record FormSetting(String key, String title, String url) {}
    public record FormSettingInput(
            @Size(max = 500)
            @Pattern(regexp = "^$|^https://(docs\\.google\\.com/forms|forms\\.gle)/.*", message = "GoogleフォームのURLを入力してください")
            String url) {}

    @GetMapping
    public List<FormSetting> list() {
        return List.of("TRANSPORT", "EXPENSE").stream()
                .map(k -> new FormSetting(k, TITLES.get(k), value("FORM_" + k)))
                .toList();
    }

    @PutMapping("/{key}")
    @Transactional
    public FormSetting save(@PathVariable String key, @Valid @RequestBody FormSettingInput in) {
        if (!TITLES.containsKey(key)) throw new IllegalArgumentException("種類が正しくありません：" + key);
        String url = in.url() == null ? "" : in.url().trim();
        jdbc.update("DELETE FROM app_setting WHERE setting_key = ?", "FORM_" + key);
        if (!url.isEmpty()) jdbc.update("INSERT INTO app_setting (setting_key, setting_value) VALUES (?, ?)", "FORM_" + key, url);
        return new FormSetting(key, TITLES.get(key), url);
    }

    private String value(String k) {
        List<String> v = jdbc.queryForList("SELECT setting_value FROM app_setting WHERE setting_key = ?", String.class, k);
        return v.isEmpty() ? "" : v.get(0);
    }
}
