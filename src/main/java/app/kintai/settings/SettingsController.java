package app.kintai.settings;

import app.kintai.employee.EmployeeService;
import app.kintai.expense.ExpenseTotals;
import app.kintai.google.GoogleWorkspace;
import app.kintai.common.Ids;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.*;

/** 画面「設定」：ひな型・フォルダ・フォーム（既存のものも登録できる）・社労士のメール */
@Controller
@RequestMapping("/settings")
public class SettingsController {
    private final AppSettings settings;
    private final GoogleWorkspace google;
    private final EmployeeService employees;

    public SettingsController(AppSettings settings, GoogleWorkspace google, EmployeeService employees) {
        this.settings = settings; this.google = google; this.employees = employees;
    }

    /** GAS 版の「社員管理表」から社員を取り込む（切り替え用） */
    @PostMapping("/import")
    public String importFromGas(@RequestParam String sheetUrl, RedirectAttributes ra) {
        try { ra.addFlashAttribute("message", employees.importFromGas(sheetUrl)); }
        catch (RuntimeException e) { ra.addFlashAttribute("error", "取り込めませんでした：" + e.getMessage()); }
        return "redirect:/settings";
    }

    @GetMapping
    public String show(Model model) {
        Map<String, String> v = new LinkedHashMap<>();
        AppSettings.KEYS.forEach(k -> v.put(k, settings.get(k)));
        model.addAttribute("v", v);
        return "settings/index";
    }

    @PostMapping
    public String save(@RequestParam Map<String, String> form, RedirectAttributes ra) {
        List<String> notes = new ArrayList<>();
        for (String k : AppSettings.KEYS) if (form.containsKey(k)) settings.set(k, form.get(k));
        // フォームの回答シートに、集計に要る列があるかを確かめる
        for (String[] f : new String[][]{{AppSettings.TRANSPORT_SHEET, "交通費"}, {AppSettings.EXPENSE_SHEET, "経費"}}) {
            String url = settings.get(f[0]);
            if (url.isEmpty()) continue;
            try {
                List<List<String>> head = google.readValues(Ids.of(url), "A1:Z1");
                List<String> miss = ExpenseTotals.missingHeaders(head.isEmpty() ? List.of() : head.get(0));
                if (!miss.isEmpty()) notes.add(f[1] + "の回答シートに「" + String.join("」「", miss) + "」の列がありません。列を足してください。");
            } catch (RuntimeException e) {
                notes.add(f[1] + "の回答シートを開けません（URLと、サービスアカウントへの共有を確認してください）。");
            }
        }
        ra.addFlashAttribute("message", "設定を保存しました。");
        if (!notes.isEmpty()) ra.addFlashAttribute("error", String.join(" ", notes));
        return "redirect:/settings";
    }
}
