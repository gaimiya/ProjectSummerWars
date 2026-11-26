-- 画面から変えられる設定（交通費・経費フォームのURLなど）
CREATE TABLE app_setting (
    setting_key   VARCHAR(50)  PRIMARY KEY,
    setting_value VARCHAR(500) NOT NULL,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
