package jp.sashiwa.kintai.service;

import jp.sashiwa.kintai.api.employee.EmployeeDtos.*;
import jp.sashiwa.kintai.domain.employee.Employee;
import jp.sashiwa.kintai.domain.employee.EmployeeRepository;
import jp.sashiwa.kintai.domain.employee.ProjectAssignment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** 社員管理の処理の本体（チェックや変換はここに書く） */
@Service
public class EmployeeService {
    private final EmployeeRepository repo;
    private final SheetProvisioner sheets;

    public EmployeeService(EmployeeRepository repo, SheetProvisioner sheets) {
        this.repo = repo;
        this.sheets = sheets;
    }

    @Transactional(readOnly = true)
    public List<EmployeeSummary> list(String q, String status) {
        String query = (q == null || q.isBlank()) ? null : q.trim();
        String st = (status == null || status.isBlank() || "すべて".equals(status)) ? null : status;
        return repo.search(query, st).stream()
                .map(e -> new EmployeeSummary(e.getEmployeeNo(), e.getName(), e.getKana(), e.getDepartment(),
                        e.getEmploymentType(), e.getJoinedOn(), e.getStatus(), e.getHousingAllowance(), e.getShareState()))
                .toList();
    }

    @Transactional(readOnly = true)
    public EmployeeDetail get(String no) {
        return toDetail(find(no));
    }

    @Transactional
    public Result create(EmployeeForm f) {
        if (repo.existsByEmployeeNo(f.no())) {
            throw new BusinessException("no", "社員番号「" + f.no() + "」はすでに使われています");
        }
        Employee e = new Employee();
        e.setEmployeeNo(f.no().trim());
        apply(e, f);
        e.setStatus("在籍");
        repo.save(e);
        // 既存の勤怠シートURLがあればそれを使う。なければ作る（Drive 連携。失敗しても登録は残す）
        String note;
        if (hasText(f.sheetUrl())) {
            e.setSheetUrl(f.sheetUrl().trim());
            e.setFolderUrl(hasText(f.folderUrl()) ? f.folderUrl().trim() : null);
            e.setShareState("入社日に共有予定");
            note = "既存の勤怠シートを使います（入社日の朝に本人へ共有します）。";
        } else try {
            SheetProvisioner.Created c = sheets.create(e);
            e.setSheetUrl(c.sheetUrl());
            e.setFolderUrl(c.folderUrl());
            e.setShareState("入社日に共有予定");
            note = "勤怠シートと個人フォルダを作成しました（入社日の朝に本人へ共有します）。";
        } catch (RuntimeException ex) {
            note = "ただし勤怠シートの作成に失敗しました：" + ex.getMessage();
        }
        return new Result(e.getName() + " さんを登録しました。" + note, e.getEmployeeNo());
    }

    @Transactional
    public Result update(String no, EmployeeForm f) {
        Employee e = find(no);
        apply(e, f);
        if (f.status() != null) e.setStatus(f.status());
        // 勤怠シート・フォルダの差し替え（null は「変えない」、空文字は「外す」）
        if (f.sheetUrl() != null) e.setSheetUrl(hasText(f.sheetUrl()) ? f.sheetUrl().trim() : null);
        if (f.folderUrl() != null) e.setFolderUrl(hasText(f.folderUrl()) ? f.folderUrl().trim() : null);
        e.touch();
        return new Result(e.getName() + " さんの変更を保存しました。", e.getEmployeeNo());
    }

    @Transactional
    public Result delete(String no) {
        Employee e = find(no);
        sheets.archive(e);   // 共有を止めて「退職者」フォルダへ
        e.markDeleted();
        return new Result(e.getName() + " さんを削除しました。勤怠シートの共有を止め、「退職者」フォルダに移しました。", no);
    }

    // ---- 内部 ----
    private Employee find(String no) {
        return repo.findByEmployeeNoAndDeletedAtIsNull(no)
                .orElseThrow(() -> new NotFoundException("社員が見つかりません：" + no));
    }

    private void apply(Employee e, EmployeeForm f) {
        e.setName(f.name().trim());
        e.setKana(f.kana());
        e.setEmail(f.mail().trim());
        e.setDepartment(f.dept());
        if (f.type() != null) e.setEmploymentType(f.type());
        e.setJoinedOn(f.joined());
        if (f.payType() != null) e.setPayType(f.payType());
        e.setBaseSalary(nz(f.base()));
        e.setStandardMinutes(toMinutes(f.stdTime()));
        e.setCommuteAllowance(nz(f.commute()));
        e.setHousingAllowance(nz(f.housing()));
        e.setFixedAllowance(nz(f.fixed()));
        e.setFixedAllowanceName(f.fixedName());
        if (f.history() != null) {
            e.replaceAssignments(f.history().stream()
                    .map(h -> new ProjectAssignment(h.project(), h.amount(), h.from(), h.to())).toList());
        }
    }

    private EmployeeDetail toDetail(Employee e) {
        return new EmployeeDetail(e.getEmployeeNo(), e.getName(), e.getKana(), e.getEmail(), e.getDepartment(),
                e.getEmploymentType(), e.getJoinedOn(), e.getStatus(), e.getPayType(), e.getBaseSalary(),
                toHhmm(e.getStandardMinutes()), e.getCommuteAllowance(), e.getHousingAllowance(),
                e.getFixedAllowance(), e.getFixedAllowanceName(), e.getSheetUrl(), e.getFolderUrl(), e.getShareState(),
                e.getAssignments().stream().map(a -> new Assignment(a.getProjectName(), a.getIncentive(),
                        a.getStartOn(), a.getEndOn())).toList());
    }

    private static int nz(Integer v) { return v == null ? 0 : v; }

    static int toMinutes(String hhmm) {
        if (hhmm == null || hhmm.isBlank()) return 480;
        String[] p = hhmm.split(":");
        return Integer.parseInt(p[0]) * 60 + Integer.parseInt(p[1]);
    }

    static String toHhmm(int m) { return (m / 60) + ":" + String.format("%02d", m % 60); }

    private static boolean hasText(String s) { return s != null && !s.isBlank(); }
}
