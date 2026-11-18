-- Novos campos para o TaskFlow PRO

ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS scheduled_date DATE,
    ADD COLUMN IF NOT EXISTS start_time TIME,
    ADD COLUMN IF NOT EXISTS end_time TIME,
    ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM';


-- Constraint de prioridade

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_tasks_priority'
          AND conrelid = 'public.tasks'::regclass
    ) THEN
        ALTER TABLE tasks
            ADD CONSTRAINT chk_tasks_priority
            CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH'));
    END IF;
END $$;


-- Constraint de horários

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_tasks_time_range'
          AND conrelid = 'public.tasks'::regclass
    ) THEN
        ALTER TABLE tasks
            ADD CONSTRAINT chk_tasks_time_range
            CHECK (
                start_time IS NULL
                OR end_time IS NULL
                OR end_time > start_time
            );
    END IF;
END $$;