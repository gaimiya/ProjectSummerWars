// 担当：山川さん（月次集計・社労士への送付）。変更する前に同じフォルダか担当フォルダの README.md を読み、担当外の人は担当者に相談する
package app.kintai.monthly;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** 月次集計の1行（1人×1か月）。社労士に渡すCSVの元 */
@Entity
@Table(name = "monthly_record", uniqueConstraints = @UniqueConstraint(columnNames = {"target_month", "employee_no"}))
public class MonthlyRecord {
    public static final String COLLECTED = "集計済み", FIXED = "確定";

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "target_month", nullable = false) private String targetMonth;   // 2026-12
    @Column(name = "employee_no", nullable = false) private String employeeNo;
    @Column(name = "employee_name") private String employeeName;
    private String department;
    @Column(name = "employment_type") private String employmentType;
    @Column(name = "pay_type") private String payType;
    @Column(name = "base_salary") private int baseSalary;
    @Column(name = "standard_minutes") private int standardMinutes;
    @Column(name = "work_days") private int workDays;
    @Column(name = "work_minutes") private int workMinutes;
    @Column(name = "overtime_minutes") private int overtimeMinutes;
    @Column(name = "night_minutes") private int nightMinutes;
    @Column(name = "saturday_minutes") private int saturdayMinutes;
    @Column(name = "holiday_minutes") private int holidayMinutes;
    @Column(name = "holiday_night_minutes") private int holidayNightMinutes;
    @Column(name = "paid_leave_days") private double paidLeaveDays;
    @Column(name = "special_leave_days") private double specialLeaveDays;
    @Column(name = "commute_allowance") private int commuteAllowance;
    @Column(name = "housing_allowance") private int housingAllowance;
    @Column(name = "fixed_allowance") private int fixedAllowance;
    @Column(name = "fixed_allowance_name") private String fixedAllowanceName;
    private int incentive;
    @Column(name = "incentive_detail") private String incentiveDetail;
    @Column(name = "transport_expense") private int transportExpense;
    @Column(name = "other_expense") private int otherExpense;
    private String status = COLLECTED;
    @Column(name = "collected_at") private LocalDateTime collectedAt;
    @Column(name = "collect_count") private int collectCount;
    @Column(name = "sheet_url") private String sheetUrl;

    protected MonthlyRecord() {}
    public MonthlyRecord(String targetMonth, String employeeNo) { this.targetMonth = targetMonth; this.employeeNo = employeeNo; }

    public Long getId() { return id; }
    public String getTargetMonth() { return targetMonth; }
    public String getEmployeeNo() { return employeeNo; }
    public String getEmployeeName() { return employeeName; } public void setEmployeeName(String v) { employeeName = v; }
    public String getDepartment() { return department; } public void setDepartment(String v) { department = v; }
    public String getEmploymentType() { return employmentType; } public void setEmploymentType(String v) { employmentType = v; }
    public String getPayType() { return payType; } public void setPayType(String v) { payType = v; }
    public int getBaseSalary() { return baseSalary; } public void setBaseSalary(int v) { baseSalary = v; }
    public int getStandardMinutes() { return standardMinutes; } public void setStandardMinutes(int v) { standardMinutes = v; }
    public int getWorkDays() { return workDays; } public void setWorkDays(int v) { workDays = v; }
    public int getWorkMinutes() { return workMinutes; } public void setWorkMinutes(int v) { workMinutes = v; }
    public int getOvertimeMinutes() { return overtimeMinutes; } public void setOvertimeMinutes(int v) { overtimeMinutes = v; }
    public int getNightMinutes() { return nightMinutes; } public void setNightMinutes(int v) { nightMinutes = v; }
    public int getSaturdayMinutes() { return saturdayMinutes; } public void setSaturdayMinutes(int v) { saturdayMinutes = v; }
    public int getHolidayMinutes() { return holidayMinutes; } public void setHolidayMinutes(int v) { holidayMinutes = v; }
    public int getHolidayNightMinutes() { return holidayNightMinutes; } public void setHolidayNightMinutes(int v) { holidayNightMinutes = v; }
    public double getPaidLeaveDays() { return paidLeaveDays; } public void setPaidLeaveDays(double v) { paidLeaveDays = v; }
    public double getSpecialLeaveDays() { return specialLeaveDays; } public void setSpecialLeaveDays(double v) { specialLeaveDays = v; }
    public int getCommuteAllowance() { return commuteAllowance; } public void setCommuteAllowance(int v) { commuteAllowance = v; }
    public int getHousingAllowance() { return housingAllowance; } public void setHousingAllowance(int v) { housingAllowance = v; }
    public int getFixedAllowance() { return fixedAllowance; } public void setFixedAllowance(int v) { fixedAllowance = v; }
    public String getFixedAllowanceName() { return fixedAllowanceName; } public void setFixedAllowanceName(String v) { fixedAllowanceName = v; }
    public int getIncentive() { return incentive; } public void setIncentive(int v) { incentive = v; }
    public String getIncentiveDetail() { return incentiveDetail; } public void setIncentiveDetail(String v) { incentiveDetail = v; }
    public int getTransportExpense() { return transportExpense; } public void setTransportExpense(int v) { transportExpense = v; }
    public int getOtherExpense() { return otherExpense; } public void setOtherExpense(int v) { otherExpense = v; }
    public String getStatus() { return status; } public void setStatus(String v) { status = v; }
    public LocalDateTime getCollectedAt() { return collectedAt; } public void setCollectedAt(LocalDateTime v) { collectedAt = v; }
    public int getCollectCount() { return collectCount; } public void setCollectCount(int v) { collectCount = v; }
    public String getSheetUrl() { return sheetUrl; } public void setSheetUrl(String v) { sheetUrl = v; }
}
