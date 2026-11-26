-- 社員（削除は deleted_at を入れる論理削除）
CREATE TABLE employee (
  id                   BIGSERIAL PRIMARY KEY,
  employee_no          VARCHAR(10)  NOT NULL UNIQUE,
  name                 VARCHAR(50)  NOT NULL,
  kana                 VARCHAR(50),
  email                VARCHAR(100) NOT NULL,
  department           VARCHAR(50),
  employment_type      VARCHAR(20)  NOT NULL DEFAULT '正社員',
  joined_on            DATE         NOT NULL,
  status               VARCHAR(10)  NOT NULL DEFAULT '在籍',
  pay_type             VARCHAR(10)  NOT NULL DEFAULT '月給',
  base_salary          INTEGER      NOT NULL DEFAULT 0,
  standard_minutes     INTEGER      NOT NULL DEFAULT 480,
  commute_allowance    INTEGER      NOT NULL DEFAULT 0,
  housing_allowance    INTEGER      NOT NULL DEFAULT 0,
  fixed_allowance      INTEGER      NOT NULL DEFAULT 0,
  fixed_allowance_name VARCHAR(50),
  sheet_url            VARCHAR(255),
  folder_url           VARCHAR(255),
  share_state          VARCHAR(20)  NOT NULL DEFAULT '未作成',
  created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at           TIMESTAMP
);

-- 案件・参画履歴
CREATE TABLE project_assignment (
  id            BIGSERIAL PRIMARY KEY,
  employee_id   BIGINT       NOT NULL REFERENCES employee(id),
  project_name  VARCHAR(100) NOT NULL,
  incentive     INTEGER      NOT NULL DEFAULT 0,
  start_on      DATE,
  end_on        DATE
);
CREATE INDEX idx_assignment_employee ON project_assignment(employee_id);
