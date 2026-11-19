/**
 * VERCEL SERVERLESS FUNCTION: /api/submit
 * Project: The Tarun Times – 27 Questions for the Birthday Boy
 * 
 * Handles atomic persistence of birthday interview answers into Supabase PostgreSQL.
 * Tables:
 * - birthday_submissions (parent submission record)
 * - birthday_answers (27 individual rows)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Helper to load .env in local development if process.env is not already populated
function loadLocalEnv() {
  const possiblePaths = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'tarun-birthday-website', '.env'),
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '.env')
  ];

  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const text = fs.readFileSync(envPath, 'utf8');
        text.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (key && val && !process.env[key]) {
              process.env[key] = val;
            }
          }
        });
        break;
      } catch (e) {
        // Ignore read errors
      }
    }
  }
}

loadLocalEnv();

module.exports = async function handler(req, res) {
  // 1. CORS Preflight Handling
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Validate HTTP Method
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      ok: false,
      error: `Method ${req.method} not allowed. Please use POST.`
    });
  }

  try {
    // 3. Parse and Validate Body
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (err) {
        return res.status(400).json({
          ok: false,
          error: 'Malformed JSON payload.'
        });
      }
    }
    body = body || {};

    const respondentName = String(body.respondent_name || 'Tarun Chandra').trim();
    const questions = body.questions;
    const answers = body.answers;

    // Validate questions and answers arrays
    if (!Array.isArray(questions) || questions.length !== 27) {
      return res.status(400).json({
        ok: false,
        error: `Validation error: Exactly 27 questions are required. Received: ${questions ? questions.length : 0}`
      });
    }

    if (!Array.isArray(answers) || answers.length !== 27) {
      return res.status(400).json({
        ok: false,
        error: `Validation error: Exactly 27 answers are required. Received: ${answers ? answers.length : 0}`
      });
    }

    // Reject empty or whitespace-only answers
    for (let i = 0; i < 27; i++) {
      const ans = String(answers[i] || '').trim();
      if (!ans) {
        return res.status(400).json({
          ok: false,
          error: `Validation error: Question ${i + 1} has an empty answer. All 27 answers must be answered.`
        });
      }
    }

    // 4. Retrieve Supabase Credentials
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('[/api/submit] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured.');
      return res.status(503).json({
        ok: false,
        error: 'Database configuration missing. Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel project settings.'
      });
    }

    // Initialize Supabase Client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const sanitizedQuestions = questions.map(q => String(q || '').trim());
    const sanitizedAnswers = answers.map(a => String(a || '').trim());

    // 5. Attempt Atomic Insert via Database Procedure (submit_birthday_interview)
    const { data: rpcData, error: rpcError } = await supabase.rpc('submit_birthday_interview', {
      p_respondent_name: respondentName,
      p_questions: sanitizedQuestions,
      p_answers: sanitizedAnswers
    });

    if (!rpcError && rpcData) {
      // Successful atomic transaction via stored procedure
      return res.status(200).json({
        ok: true,
        submission_id: rpcData.submission_id,
        respondent_name: rpcData.respondent_name || respondentName,
        answers_count: 27,
        submitted_at: rpcData.submitted_at || new Date().toISOString(),
        message: 'Successfully saved all 27 question-answer records in Supabase PostgreSQL.'
      });
    }

    // 6. Fallback: Table-level insertion with atomic rollback if RPC function is not installed
    console.warn('RPC not available or errored, executing direct table insertion with rollback guarantee...', rpcError ? rpcError.message : '');

    // Step A: Insert parent submission
    const { data: subData, error: subError } = await supabase
      .from('birthday_submissions')
      .insert({
        respondent_name: respondentName,
        status: 'COMPLETED'
      })
      .select('id, submitted_at, respondent_name')
      .single();

    if (subError || !subData) {
      console.error('Error creating submission record:', subError);
      let userFriendlyError = subError ? subError.message : 'Unknown error';
      if (subError && (subError.code === 'PGRST205' || String(userFriendlyError).includes('schema cache') || String(userFriendlyError).includes('does not exist'))) {
        userFriendlyError = "Database tables are not created yet in Supabase! Please open your Supabase Dashboard -> SQL Editor and run the supabase-migration.sql script once to create the tables.";
      } else if (subError && (subError.code === '42501' || String(userFriendlyError).includes('permission denied'))) {
        userFriendlyError = "Permission denied in Supabase. Please open your Supabase Dashboard -> SQL Editor and run the GRANT statements from supabase-migration.sql (GRANT ALL ON TABLE birthday_submissions, birthday_answers TO service_role;).";
      }
      return res.status(500).json({
        ok: false,
        code: (subError && subError.code) || 'DB_ERROR',
        error: userFriendlyError
      });
    }

    const submissionId = subData.id;

    // Step B: Prepare all 27 answer rows
    const answerRows = sanitizedQuestions.map((qText, index) => ({
      submission_id: submissionId,
      question_number: index + 1,
      question_text: qText,
      answer_text: sanitizedAnswers[index]
    }));

    // Step C: Insert answer rows
    const { data: ansData, error: ansError } = await supabase
      .from('birthday_answers')
      .insert(answerRows)
      .select('id');

    if (ansError) {
      console.error('Error inserting answers. Rolling back submission:', ansError);
      // Atomic cleanup: delete parent submission so no partial data remains
      await supabase.from('birthday_submissions').delete().eq('id', submissionId);

      let userFriendlyError = ansError.message || 'Unknown error';
      if (ansError.code === '42501' || String(userFriendlyError).includes('permission denied')) {
        userFriendlyError = "Permission denied for birthday_answers table in Supabase. Please run: GRANT ALL ON TABLE birthday_answers TO service_role;";
      }

      return res.status(500).json({
        ok: false,
        error: `Database error while saving answers: ${userFriendlyError}. Submission rolled back.`
      });
    }

    return res.status(200).json({
      ok: true,
      submission_id: submissionId,
      respondent_name: respondentName,
      answers_count: 27,
      submitted_at: subData.submitted_at,
      message: 'Successfully saved all 27 question-answer records in Supabase PostgreSQL.'
    });

  } catch (err) {
    console.error('Unexpected error in /api/submit:', err);
    return res.status(500).json({
      ok: false,
      error: `Internal server error: ${err.message || 'Unknown error'}`
    });
  }
};
