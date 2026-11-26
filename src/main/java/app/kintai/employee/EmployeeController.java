package app.kintai.employee;

import app.kintai.common.BusinessException;
import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/** 画面「社員管理」 */
@Controller
@RequestMapping("/employees")
public class EmployeeController {
    static final String HOUSING_NOTE = "在籍7か月以上の社員は 10,000 円";
    private final EmployeeService service;

    public EmployeeController(EmployeeService service) { this.service = service; }

    @GetMapping
    public String list(@RequestParam(defaultValue = "") String q, @RequestParam(defaultValue = "すべて") String status, Model model) {
        model.addAttribute("list", service.list(q, status));
        model.addAttribute("q", q);
        model.addAttribute("status", status);
        return "employees/list";
    }

    @GetMapping("/new")
    public String newForm(Model model) {
        model.addAttribute("form", new EmployeeForm().withBlankRows(2));
        return formView(model, true);
    }

    @PostMapping("/new")
    public String create(@Valid @ModelAttribute("form") EmployeeForm form, BindingResult br, Model model, RedirectAttributes ra) {
        if (br.hasErrors()) return formView(model, true);
        try {
            ra.addFlashAttribute("message", service.create(form));
            return "redirect:/employees";
        } catch (BusinessException e) {
            br.rejectValue(e.getField(), "dup", e.getMessage());
            return formView(model, true);
        }
    }

    @GetMapping("/{no}")
    public String detail(@PathVariable String no, Model model) {
        model.addAttribute("form", service.toForm(no).withBlankRows(2));
        model.addAttribute("employee", service.get(no));
        return formView(model, false);
    }

    @PostMapping("/{no}")
    public String update(@PathVariable String no, @Valid @ModelAttribute("form") EmployeeForm form, BindingResult br,
                         Model model, RedirectAttributes ra) {
        if (br.hasErrors()) { model.addAttribute("employee", service.get(no)); return formView(model, false); }
        ra.addFlashAttribute("message", service.update(no, form));
        return "redirect:/employees/" + no;
    }

    @PostMapping("/{no}/delete")
    public String delete(@PathVariable String no, RedirectAttributes ra) {
        ra.addFlashAttribute("message", service.delete(no));
        return "redirect:/employees";
    }

    @PostMapping("/{no}/recreate-sheet")
    public String recreate(@PathVariable String no, RedirectAttributes ra) {
        try { ra.addFlashAttribute("message", service.recreateSheet(no)); }
        catch (RuntimeException e) { ra.addFlashAttribute("error", "作り直せませんでした：" + e.getMessage()); }
        return "redirect:/employees/" + no;
    }

    private String formView(Model model, boolean isNew) {
        model.addAttribute("isNew", isNew);
        model.addAttribute("housingNote", HOUSING_NOTE);
        return "employees/form";
    }
}
