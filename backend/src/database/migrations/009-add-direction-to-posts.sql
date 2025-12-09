ALTER TABLE posts ADD COLUMN IF NOT EXISTS direction VARCHAR(10) DEFAULT 'ltr' CHECK (direction IN ('ltr', 'rtl'));
