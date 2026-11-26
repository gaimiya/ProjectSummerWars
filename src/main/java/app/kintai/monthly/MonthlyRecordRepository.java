// 担当：山川さん（月次集計・社労士への送付）。変更する前に同じフォルダか担当フォルダの README.md を読み、担当外の人は担当者に相談する
package app.kintai.monthly;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MonthlyRecordRepository extends JpaRepository<MonthlyRecord, Long> {
    List<MonthlyRecord> findByTargetMonthOrderByEmployeeNo(String targetMonth);
    Optional<MonthlyRecord> findByTargetMonthAndEmployeeNo(String targetMonth, String employeeNo);
}
