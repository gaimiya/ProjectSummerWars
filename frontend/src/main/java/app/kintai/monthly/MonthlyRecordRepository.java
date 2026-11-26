package app.kintai.monthly;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MonthlyRecordRepository extends JpaRepository<MonthlyRecord, Long> {
    List<MonthlyRecord> findByTargetMonthOrderByEmployeeNo(String targetMonth);
    Optional<MonthlyRecord> findByTargetMonthAndEmployeeNo(String targetMonth, String employeeNo);
}
