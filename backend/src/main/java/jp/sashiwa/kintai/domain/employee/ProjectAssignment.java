package jp.sashiwa.kintai.domain.employee;

import jakarta.persistence.*;
import java.time.LocalDate;

/** 案件・参画履歴 */
@Entity
@Table(name = "project_assignment")
public class ProjectAssignment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "employee_id")
    private Employee employee;
    @Column(name = "project_name", nullable = false) private String projectName;
    private int incentive;
    @Column(name = "start_on") private LocalDate startOn;
    @Column(name = "end_on") private LocalDate endOn;

    protected ProjectAssignment() {}
    public ProjectAssignment(String projectName, int incentive, LocalDate startOn, LocalDate endOn) {
        this.projectName = projectName; this.incentive = incentive; this.startOn = startOn; this.endOn = endOn;
    }
    void setEmployee(Employee e) { employee = e; }
    public String getProjectName() { return projectName; }
    public int getIncentive() { return incentive; }
    public LocalDate getStartOn() { return startOn; }
    public LocalDate getEndOn() { return endOn; }
}
