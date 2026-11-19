# The Tarun Times — A Romantic Birthday Experience
### *"A Love Letter Disguised as a Birthday Newspaper"*

A beautifully redesigned, emotionally engaging romantic birthday experience created by a girlfriend for her boyfriend, Tarun Chandra, on his 28th Golden Birthday.

---

## 🌹 What’s Inside This Experience

1. **Romantic Invitation Welcome Screen:**
   - Handwritten label: *"Made with love, especially for you"*
   - Masthead: *"The Tarun Times · The Love Edition · Vol. 28"*
   - Emotional Headline: *"27 Questions for My Favourite Person"*
   - Subtitle: *"27 little questions, countless memories, and one surprise waiting just for you."*
   - Editorial Golden Year Medallion (Tarun's 28th birthday tribute)
   - Personal love note: *"Take your time, birthday boy. Every answer means something to me."*
   - Ambient floating hearts drifting gently across the warm ivory background.

2. **Personalized 27-Question Interactive Interview:**
   - Soft pink/ivory card with champagne gold and dusty rose accents.
   - Large serif question numbers (`01` to `27`).
   - Category badge: `"A LITTLE QUESTION FROM YOUR GIRL ❤️"`
   - Spacious answer stationery with romantic placeholder: `"Tell me what was going through your mind... ❤️"`
   - Smooth animated card transitions between questions.
   - Dual-toned progress bar with an animated glowing heart pin tracking completion.
   - Real-time autosave to `localStorage` (no lost answers if the browser refreshes).
   - Previous and Next navigation, with `Ctrl+Enter` shortcut support.
   - Preserves all 27 original questions in their exact order.

3. **Emotional Completion Screen:**
   - Crimson wax seal emblem with keepsake statistics.
   - Heading: *"You made it through all 27 questions! ❤️"*
   - Heartfelt message thanking him for opening his heart and reliving memories.
   - Prominent *"Unlock Your Birthday Surprise ❤️"* button.

4. **Multi-Stage Surprise Reveal & Final Poster:**
   - Emotional transition screen: *"A little surprise for you..."* with a pulsing heart.
   - Zoom and fade reveal animation into the final keepsake screen.
   - Shower of celebratory hearts and champagne gold confetti.
   - Prominently showcases the exact original poster: `The Tarun Times.pdf` / `tarun-times-poster.png`.
   - Final loving sign-off:
     > *"Happy 28th Birthday, Tarun ❤️"*
     > *"You are my favourite story, my happiest chapter and the person I want to celebrate every year."*
     > *"The man I love forever."*
   - Download options for both PDF and high-resolution PNG.
   - Built-in Fullscreen Lightbox for zooming in and reading every newspaper article comfortably on mobile and desktop.

---

## 🎨 Color Palette & Typography

- **Warm Ivory:** `#FFF8F2` (Background)
- **Deep Wine:** `#873B4B` (Primary CTA & Brand)
- **Dusty Rose:** `#C98591` (Secondary Accents & Borders)
- **Champagne Gold:** `#C5A16C` (Ornamental rules, badges, and glows)
- **Dark Chocolate:** `#352A2A` (Text & high readability)
- **Card Background:** `#FFFCF9`
- **Soft Pink:** `#F6E5E5`
- **Typography:** *Playfair Display* (Headings), *Cormorant Garamond* (Editorial & Prompts), *Inter* (Buttons & UI), *Alex Brush* (Handwritten script notes).

---

## 💌 Setup & Publishing Guide

### Step 1: Connect Google Sheets (Keepsake Workbook)
1. Create a new Google Sheet (e.g. name it *Tarun's 28th Birthday Keepsake*).
2. In the Google Sheet, go to **Extensions → Apps Script**.
3. Replace the code in `Code.gs` with the entire content of `google-apps-script.gs`.
4. Choose a secret passphrase of your choice.
5. In `google-apps-script.gs`, replace `CHANGE_THIS_TO_A_LONG_RANDOM_SECRET` with your secret passphrase.
6. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Click **Deploy**, authorize permissions, and copy the Web App URL (ending in `/exec`).
8. Set your credentials in the separate environment file **`.env`** (or **`env.js`**):
   ```env
   GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   SHARED_SECRET=YOUR_SECRET_PASSPHRASE
   ```
*(Note: If you preview the site before adding the URL, it automatically runs in Preview Mode so you can inspect the full questionnaire and surprise reveal without errors).*

### Step 2: Preview Locally
Run a local static server from the project directory:
```bash
python -m http.server 8080
```
Open `http://localhost:8080` in any browser or on your phone connected to the same Wi-Fi.

### Step 3: Deploy & Share with Tarun
Deploy the static website to:
- **Netlify:** Drag and drop the `tarun-birthday-website` folder into [Netlify Drop](https://app.netlify.com/drop).
- **Vercel:** Import this folder as a static project.
- **GitHub Pages:** Push to GitHub and enable Pages on the repository.

Once deployed, send Tarun the link and let him experience his birthday surprise! ❤️
