// 担当：山川さん（月次集計・社労士への送付）。変更する前に同じフォルダか担当フォルダの README.md を読み、担当外の人は担当者に相談する
package app.kintai.monthly;

import app.kintai.attendance.MonthSheetService;
import app.kintai.google.GoogleWorkspace;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.nio.charset.StandardCharsets;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

/** 画面「月次集計」：月のシート作成 → 集計 → 確認 → CSV（ダウンロード・社労士へ送る）→ 確定 */
@Controller
@RequestMapping("/monthly")
public class MonthlyController {
    private final MonthlyService service;
    private final MonthSheetService sheets;
    private final GoogleWorkspace google;

    public MonthlyController(MonthlyService service, MonthSheetService sheets, GoogleWorkspace google) {
        this.service = service; this.sheets = sheets; this.google = google;
    }

    @GetMapping
    public String show(@RequestParam(required = false) YearMonth ym, Model model) {
        YearMonth month = ym != null ? ym : YearMonth.now().minusMonths(1);
        List<MonthlyRecord> list = service.list(month);
        model.addAttribute("ym", month);
        model.addAttribute("header", MonthlyColumns.HEADER);
        model.addAttribute("rows", list.stream().map(MonthlyColumns::row).toList());
        model.addAttribute("fixed", !list.isEmpty() && list.stream().allMatch(r -> MonthlyRecord.FIXED.equals(r.getStatus())));
        model.addAttribute("fake", google.isFake());
        return "monthly/index";
    }

    @PostMapping("/sheets")
    public String createSheets(@RequestParam YearMonth ym, RedirectAttributes ra) {
        var r = sheets.createForAll(ym);
        List<String> lines = new ArrayList<>(List.of(ym + " のシートを作りました：" + r.made().size() + "人",
                "すでにあった：" + r.skipped().size() + "人"));
        ra.addFlashAttribute("message", String.join("　", lines));
        if (!r.failed().isEmpty()) ra.addFlashAttribute("errors", r.failed());
        return "redirect:/monthly?ym=" + ym;
    }

    @PostMapping("/collect")
    public String collect(@RequestParam YearMonth ym, RedirectAttributes ra) {
        var r = service.collect(ym);
        ra.addFlashAttribute("message", ym + " を集計しました：" + r.ok().size() + "人");
        if (!r.ng().isEmpty()) ra.addFlashAttribute("errors", r.ng());
        return "redirect:/monthly?ym=" + ym;
    }

    @GetMapping("/csv")
    public ResponseEntity<byte[]> csv(@RequestParam YearMonth ym) {
        byte[] body = service.csv(ym).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename("勤怠集計_" + ym + ".csv", StandardCharsets.UTF_8).build().toString())
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8)).body(body);
    }

    @PostMapping("/send")
    public String send(@RequestParam YearMonth ym, RedirectAttributes ra) {
        try { ra.addFlashAttribute("message", service.sendCsv(ym)); }
        catch (Exception e) { ra.addFlashAttribute("error", e.getMessage()); }
        return "redirect:/monthly?ym=" + ym;
    }

    @PostMapping("/fix")
    public String fix(@RequestParam YearMonth ym, RedirectAttributes ra) {
        service.fix(ym);
        ra.addFlashAttribute("message", ym + " を確定しました。確定した月は集計し直しません。");
        return "redirect:/monthly?ym=" + ym;
    }
}
