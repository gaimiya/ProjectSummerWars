package app.kintai.employee;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    /** 削除していない社員を、検索語（氏名・フリガナ・社員番号）と在籍で絞り込む */
    @Query("""
        select e from Employee e
        where e.deletedAt is null
          and (:status is null or e.status = :status)
          and (:q is null or e.name like concat('%', :q, '%')
                          or e.kana like concat('%', :q, '%')
                          or e.employeeNo like concat('%', :q, '%'))
        order by e.employeeNo
        """)
    List<Employee> search(@Param("q") String q, @Param("status") String status);

    Optional<Employee> findByEmployeeNoAndDeletedAtIsNull(String employeeNo);

    boolean existsByEmployeeNo(String employeeNo);

    /** 削除していない全員（月次集計・月のシート作成で使う） */
    List<Employee> findByDeletedAtIsNullOrderByEmployeeNo();
}
