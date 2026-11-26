-- 画面「設定」で変えられる値（ひな型・フォルダ・フォームの回答シート・社労士のメールなど）
CREATE TABLE app_setting (
    setting_key   VARCHAR(50)  PRIMARY KEY,
    setting_value VARCHAR(500) NOT NULL,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
