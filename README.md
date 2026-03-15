# 📱 Navvi — iOS Prototype Demo Wrapper

> A polished iPhone 15 Pro mockup page that presents the Navvi product prototype as an interactive mobile experience — built for sharing with recruiters, stakeholders, and product teams.

🔗 View Live Demo →  
📲 **[Open Prototype Directly →](https://navvi-microsoft-case-study-product-prototype-dskumoq9v.vercel.app)**

---

## 🧭 What is Navvi?

Navvi is a **Microsoft product case study** exploring AI-powered navigation and productivity within the Microsoft 365 ecosystem. This repo contains the **demo presentation wrapper** — an iPhone frame UI that wraps the live prototype for a polished, shareable experience.

The prototype itself was built using [Lovable](https://lovable.dev) and deployed on Vercel.

---

## ✨ What This Wrapper Does

- Renders the live Navvi prototype inside a **pixel-accurate iPhone 15 Pro frame**
- Includes Dynamic Island, status bar (with live clock), volume buttons, and home indicator
- Ambient dark background with subtle grid and gradient atmosphere
- Responsive — scales gracefully on smaller screens
- **Actions panel**: open full screen, copy prototype link, export to PDF
- Auto-detects if the iframe is blocked and shows a clean fallback CTA

---

## 🗂 Repo Structure

```
navvi-demo-wrapper/
├── index.html        # The entire demo wrapper (single file, zero dependencies)
└── README.md         # You're reading it
```

No build step. No npm install. No framework. Just one HTML file — drop it anywhere and it works.

---

## 🚀 Deploy in 3 Steps

**1. Fork or clone this repo**
```bash
git clone https://github.com/YOUR_USERNAME/navvi-demo-wrapper.git
```

**2. Push to GitHub**
```bash
git add .
git commit -m "Initial deploy"
git push origin main
```

**3. Import into Vercel**
- Go to [vercel.com](https://vercel.com) → Add New Project
- Select this repo
- Vercel auto-detects it as a static site — hit **Deploy**
- Done. You'll have a live URL in ~30 seconds.

---

## 🔧 Fix Iframe Embedding (Optional)

If the prototype appears blank inside the phone frame, it's because Vercel blocks cross-origin iframe embedding by default. To fix it, add a `vercel.json` to the **Navvi app repo** (not this one):

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "ALLOWALL" }
      ]
    }
  ]
}
```

Redeploy the Navvi app and the phone screen will show the live prototype directly.

---

## 🛠 Customization

| What to change | Where in `index.html` |
|---|---|
| Prototype URL | Replace all instances of the Vercel URL |
| App title / description | Edit the `.info-panel` section |
| Accent colors | Update `--accent` and `--accent2` CSS variables |
| Meta tags (left panel) | Edit `.meta-item` list items |

---

## 👩‍💼 About This Project

This wrapper was built as part of a **Product Management case study** for Cornell Tech's MBA program. The Navvi prototype demonstrates product thinking, UX design, and prototyping skills applied to an enterprise AI use case within the Microsoft ecosystem.

**Built by:** Dimple Rathod  
**Program:** Cornell Tech MBA, Product Strategy/Management & Technology  
**Connect:** [LinkedIn](https://www.linkedin.com/in/dimplecrathod/) · [Portfolio](https://who-is-dimple-rathod.vercel.app/)

---

## 📄 License

MIT — feel free to fork and adapt for your own prototype presentations.
