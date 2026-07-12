# MyFive Golf

**Pick your five. Chase zero events.**

A minimalist, responsive, offline-first mobile web app for tracking the five golf mistakes that cost *you* the most strokes — chosen from a library of 18 stats. The successor to [Tiger 5 stats](https://github.com/SwePalm/tiger5stats), rebuilt so every golfer can pick their own five.

---

## ⛳ The Concept

A great round of golf isn't about hitting 18 perfect shots — it's about avoiding the handful of specific errors that leak strokes. The original Tiger 5 tracked one fixed set of five. MyFive Golf keeps the same zero-friction logging, but lets **you choose which five events to track** from a library covering the whole game:

| Category | Stats |
|---|---|
| **Scoring** | Double Bogey+ • Triple Bogey+ • Bogey on Par 5 • Double on Par 3 |
| **Off the Tee** | Lost Ball off Tee • Tee Shot in Hazard • Punch-Out • Re-Tee |
| **Approach** | Wedge Miss • Duff / Top • Approach in Trouble |
| **Short Game** | Chipped Twice+ • Left in Bunker • Chip Missed Green |
| **Putting** | Three Putt+ • Missed Short Putt |
| **General** | Penalty Stroke • Mental Error |

Quick presets get you started:

* **Classic Tiger 5** — the original five score-wreckers
* **Beginner 5** — stop the big numbers first (lost balls, penalties, triples…)
* **Short Game 5** — sharpen everything inside 100m

**The goal stays the same: zero events.**

## 🎯 How Tracking Works

* On first launch you pick your five (change them anytime in **Settings → My 5 Stats**).
* During a round, each hole shows five big toggles — tap the ones that happened, hit Next Hole.
* Par-restricted stats (like *Bogey on Par 5*) automatically disable on other pars.
* Every finished round remembers the five stats it was played with, so your history stays honest even after you change your selection.
* The **MyFive Index** normalizes events per 18 holes so 9-hole and 18-hole rounds compare fairly. Target: 0.0.

---

## 📱 iPhone Installation & Setup

Because this is a Progressive Web App (PWA), it behaves like a native iOS application — home screen icon, fullscreen view, and full offline capability.

The app is live at **[swepalm.github.io/my-five-golf](https://swepalm.github.io/my-five-golf/)**.

### How to install it on your iPhone:
1. Open **Safari** and navigate to `https://swepalm.github.io/my-five-golf/`.
2. Tap the **Share** button and select **Add to Home Screen**.
3. Name it **MyFive** and tap **Add**.
4. Launch the app from your home screen — after the first visit it works fully offline.

---

## 💻 Running the App Locally

```bash
# Navigate to the project folder
cd new_golf_app

# Start a local Python web server
python3 -m http.server 8000
```

Now navigate to [http://localhost:8000](http://localhost:8000) in your browser.

---

## 🛠️ Key Features

* **Your 5, from a library of 18:** Pick the stats that match your game — beginners can track lost balls and penalties, low handicappers can chase wedge misses.
* **High-Contrast Themes:** Night Round dark mode and a Sunlight-Optimized light mode for visibility on the course. Follows your system setting by default; toggle inside **Settings**.
* **Zero-Friction Logging:** Big, glove-friendly buttons (minimum 56px touch targets). Tap through holes in under 5 seconds.
* **Context-Aware Toggles:** Par-restricted stats automatically disable on holes where they can't apply.
* **Course Memory:** The app learns every course you finish a round on — the par you set for each hole is remembered (by real hole number) and pre-filled next time. Course names autocomplete at round setup, and you can start from any hole (start at 10, play 9 back-nine holes — or wrap past 18 back to 1). Manage saved courses in Settings.
* **Resume In-Progress Rounds:** Close the app mid-round and it offers to restore your progress on next launch.
* **Interactive Charts:** Lightweight SVG charts show your MyFive Index trend over time and rank your most frequent leaks.
* **100% Offline & Safe:** All data stays on your device (`localStorage`). Export to JSON / CSV from Settings — and old **Tiger 5 stats backups import directly**, so no history is lost.

---

## 📁 File Structure

```
new_golf_app/
├── README.md          # Project documentation (this file)
├── index.html         # Main SPA layout
├── style.css          # Design system & theme styles
├── app.js             # Stat library, state controller & stats math
├── manifest.json      # PWA metadata
├── sw.js              # Service Worker for offline capability
└── icons/             # App icons
    ├── logo.svg       # "5 + golf ball" logo
    ├── icon-192.png   # 192px app launcher icon
    └── icon-512.png   # 512px app launcher icon
```
