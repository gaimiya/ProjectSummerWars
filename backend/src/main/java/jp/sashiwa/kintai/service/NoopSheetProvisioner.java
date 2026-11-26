package jp.sashiwa.kintai.service;

import jp.sashiwa.kintai.domain.employee.Employee;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

/** Drive 連携ができるまでの仮実装（ログに出すだけ） */
@Component
@ConditionalOnMissingBean(value = SheetProvisioner.class, ignored = NoopSheetProvisioner.class)
public class NoopSheetProvisioner implements SheetProvisioner {
    private static final Logger log = LoggerFactory.getLogger(NoopSheetProvisioner.class);

    @Override
    public Created create(Employee e) {
        log.info("[仮] 勤怠シート作成：{}_{}", e.getEmployeeNo(), e.getName());
        return new Created("https://example.invalid/sheet/" + e.getEmployeeNo(),
                "https://example.invalid/folder/" + e.getEmployeeNo());
    }

    @Override
    public void archive(Employee e) {
        log.info("[仮] 共有停止・退職者フォルダへ：{}", e.getEmployeeNo());
    }
}
