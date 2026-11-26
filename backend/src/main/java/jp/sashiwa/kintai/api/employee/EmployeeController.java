package jp.sashiwa.kintai.api.employee;

import jakarta.validation.Valid;
import jp.sashiwa.kintai.api.employee.EmployeeDtos.*;
import jp.sashiwa.kintai.service.EmployeeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** 社員管理API（URLを受けるだけ。処理は EmployeeService） */
@RestController
@RequestMapping("/api/employees")
public class EmployeeController {
    private final EmployeeService service;

    public EmployeeController(EmployeeService service) { this.service = service; }

    @GetMapping
    public List<EmployeeSummary> list(@RequestParam(required = false) String q,
                                      @RequestParam(required = false) String status) {
        return service.list(q, status);
    }

    @GetMapping("/{no}")
    public EmployeeDetail get(@PathVariable String no) { return service.get(no); }

    @PostMapping
    public Result create(@Valid @RequestBody EmployeeForm form) { return service.create(form); }

    @PutMapping("/{no}")
    public Result update(@PathVariable String no, @Valid @RequestBody EmployeeForm form) { return service.update(no, form); }

    @DeleteMapping("/{no}")
    public Result delete(@PathVariable String no) { return service.delete(no); }
}
