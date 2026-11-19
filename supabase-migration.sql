-- ============================================================================
-- SUPABASE MIGRATION: THE TARUN TIMES (BIRTHDAY ANSWERS DATABASE)
-- Project: The Tarun Times – 27 Questions for the Birthday Boy
-- ============================================================================

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create birthday_submissions table
CREATE TABLE IF NOT EXISTS birthday_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    respondent_name TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'COMPLETED'
);

-- 3. Create birthday_answers table
CREATE TABLE IF NOT EXISTS birthday_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES birthday_submissions(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_submission_question UNIQUE (submission_id, question_number)
);

-- 4. Create indexes for high-performance lookup
CREATE INDEX IF NOT EXISTS idx_birthday_answers_submission_id 
    ON birthday_answers(submission_id);

CREATE INDEX IF NOT EXISTS idx_birthday_submissions_submitted_at 
    ON birthday_submissions(submitted_at DESC);

-- 5. Enable Row Level Security (RLS) on both tables
ALTER TABLE birthday_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthday_answers ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies: Restrict access completely from anonymous / public users
-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Service role full access on submissions" ON birthday_submissions;
DROP POLICY IF EXISTS "Service role full access on answers" ON birthday_answers;
DROP POLICY IF EXISTS "Deny public select on submissions" ON birthday_submissions;
DROP POLICY IF EXISTS "Deny public select on answers" ON birthday_answers;

-- Only service_role (used by Vercel serverless backend) can access the data
CREATE POLICY "Service role full access on submissions"
    ON birthday_submissions
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access on answers"
    ON birthday_answers
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 7. Atomic Transaction Procedure: submit_birthday_interview
-- Ensures all 27 answers and parent submission are saved atomically.
-- If any answer fails or is missing, the entire transaction rolls back.
CREATE OR REPLACE FUNCTION submit_birthday_interview(
    p_respondent_name TEXT,
    p_questions TEXT[],
    p_answers TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_submission_id UUID;
    v_total_questions CONSTANT INTEGER := 27;
    i INTEGER;
BEGIN
    -- Validate exact array length for both questions and answers
    IF array_length(p_questions, 1) IS DISTINCT FROM v_total_questions OR
       array_length(p_answers, 1) IS DISTINCT FROM v_total_questions THEN
        RAISE EXCEPTION 'Validation error: Exactly % questions and % answers are required. Received: % questions, % answers',
            v_total_questions, v_total_questions, 
            COALESCE(array_length(p_questions, 1), 0), 
            COALESCE(array_length(p_answers, 1), 0);
    END IF;

    -- Validate that no answer is empty or whitespace-only
    FOR i IN 1..v_total_questions LOOP
        IF p_answers[i] IS NULL OR trim(p_answers[i]) = '' THEN
            RAISE EXCEPTION 'Validation error: Question % has an empty answer. All % answers must be provided.', i, v_total_questions;
        END IF;
    END LOOP;

    -- Step 1: Insert parent submission
    INSERT INTO birthday_submissions (
        respondent_name,
        submitted_at,
        status
    ) VALUES (
        COALESCE(NULLIF(trim(p_respondent_name), ''), 'Tarun Chandra'),
        NOW(),
        'COMPLETED'
    )
    RETURNING id INTO v_submission_id;

    -- Step 2: Insert all 27 answer rows
    FOR i IN 1..v_total_questions LOOP
        INSERT INTO birthday_answers (
            submission_id,
            question_number,
            question_text,
            answer_text,
            created_at
        ) VALUES (
            v_submission_id,
            i,
            trim(p_questions[i]),
            trim(p_answers[i]),
            NOW()
        );
    END LOOP;

    -- Return structured success payload
    RETURN jsonb_build_object(
        'ok', true,
        'submission_id', v_submission_id,
        'respondent_name', COALESCE(NULLIF(trim(p_respondent_name), ''), 'Tarun Chandra'),
        'answers_count', v_total_questions,
        'submitted_at', NOW(),
        'message', 'Successfully recorded all 27 question-answer pairs.'
    );

EXCEPTION WHEN OTHERS THEN
    -- In case of any error, PostgreSQL rolls back the entire operation automatically
    RAISE;
END;
$$;

-- Grant execution permission on the function to service_role
GRANT EXECUTE ON FUNCTION submit_birthday_interview(TEXT, TEXT[], TEXT[]) TO service_role;
