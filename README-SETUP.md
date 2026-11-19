# The Tarun Times — A Romantic Birthday Experience
### *"A Love Letter Disguised as a Birthday Newspaper"*

A beautifully designed, emotionally engaging romantic birthday experience created by a girlfriend for her boyfriend, Tarun Chandra, on his 28th Golden Birthday.

---

## 🏗️ Architecture: Vercel + Supabase PostgreSQL

- **Frontend**: Vanilla HTML5, CSS3 & JavaScript (No heavy frameworks, romantic typography & micro-interactions).
- **Hosting**: Vercel.
- **Serverless Backend**: Vercel Serverless Function at `api/submit.js` (`POST /api/submit`).
- **Database**: Supabase PostgreSQL with Row Level Security (RLS) and atomic transaction guarantees.

---

## 🗄️ Database Tables (Supabase)

### Table 1: `birthday_submissions`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique Submission Identifier |
| `respondent_name` | `TEXT` | `NOT NULL` | Name of the respondent (`Tarun Chandra`) |
| `submitted_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Submission timestamp with timezone |
| `status` | `TEXT` | `DEFAULT 'COMPLETED'` | Status flag |

### Table 2: `birthday_answers`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique Answer Identifier |
| `submission_id` | `UUID` | `REFERENCES birthday_submissions(id) ON DELETE CASCADE` | Foreign Key to parent submission |
| `question_number` | `INTEGER` | `NOT NULL` | Sequential number (1 to 27) |
| `question_text` | `TEXT` | `NOT NULL` | Exact wording of the question |
| `answer_text` | `TEXT` | `NOT NULL` | Tarun's heartfelt answer |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record creation timestamp |

- **Security & Integrity**:
  - `UNIQUE (submission_id, question_number)` prevents duplicate answers per question.
  - Row Level Security (RLS) is enabled on both tables.
  - Anonymous users are completely blocked from reading or altering stored answers.
  - Only the Vercel serverless function (authenticated via `SUPABASE_SERVICE_ROLE_KEY`) can insert or query answers.
  - Database function `submit_birthday_interview(p_respondent_name, p_questions, p_answers)` wraps all 27 inserts into an atomic transaction: if any answer fails, everything rolls back automatically.

---

## 🚀 Setup & Deployment Guide

### Step 1: Create Supabase Tables
1. Open your Supabase Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** tab (left sidebar).
3. Copy the entire contents of [`supabase-migration.sql`](./supabase-migration.sql) and paste it into the editor.
4. Click **Run**. Both tables, indexes, RLS policies, and the atomic stored procedure will be created instantly.

### Step 2: Configure Environment Variables
1. In your Supabase Project, go to **Project Settings → API**.
2. Copy the **Project URL** and the **`service_role` (secret)** key.
3. In **Vercel**:
   - Go to your Project on Vercel: **Settings → Environment Variables**.
   - Add:
     - `SUPABASE_URL`: `https://your-project-id.supabase.co`
     - `SUPABASE_SERVICE_ROLE_KEY`: `your-service-role-secret-key`
   - Select Environments: **Production**, **Preview**, and **Development**.
4. In your local development `.env`:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
   ```

### Step 3: Run Locally
Do **not** use Python's built-in `http.server` (it returns `501 Unsupported method` for POST requests).

Use Vercel CLI or npm:
```bash
# Option A: Run with Vercel CLI (matches production serverless environment)
npx vercel dev

# Option B: Run with the included Node.js server
npm start
```
Open `http://localhost:8080` (or `http://localhost:3000` with Vercel CLI).

### Step 4: Deploy to Vercel
Deploy with Git or the Vercel CLI:
```bash
vercel --prod
```
The Vercel Serverless Function at `api/submit.js` will automatically deploy, handle `POST /api/submit`, store all 27 records into Supabase PostgreSQL atomically, and unlock Tarun's surprise poster.

---

## 🧪 Run Integration Tests

Run the full automated test suite verifying all 10 integration requirements:
```bash
npm test
```
