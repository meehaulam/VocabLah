<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# VocabLah 📚

> Master vocabulary with spaced repetition - A modern vocabulary learning app built with React, TypeScript, and the SM-2 algorithm.

[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF?logo=vite)](https://vitejs.dev)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)

## ✨ Features

- 🧠 **Spaced Repetition System** - SM-2 algorithm for optimal learning
- 📁 **Collections** - Organize words into custom collections
- 🎴 **Flashcards** - Interactive 3D flipping cards
- 📊 **Progress Tracking** - Visualize your learning journey
- 🌙 **Dark Mode** - Easy on the eyes
- 📱 **Responsive** - Works on all devices
- 💾 **Offline-First** - All data stored locally (no backend required)
- 🎯 **Smart Scheduling** - Reviews cards when your brain is ready

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18 or higher
- **npm** (comes with Node.js)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/VocabLah.git
   cd VocabLah
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Build for Production

```bash
npm run build
npm run preview  # Test production build locally
```

## 📦 Deployment

### Deploy to Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Deploy to Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📖 Documentation

- **[REVIEW_REPORT.md](./REVIEW_REPORT.md)** - Comprehensive code review and optimization guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide for various platforms

## 🛠️ Tech Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Storage**: Browser LocalStorage
- **Algorithm**: SuperMemo SM-2

## 📁 Project Structure

```
VocabLah/
├── components/         # React components
│   ├── Dashboard.tsx
│   ├── ReviewMode.tsx
│   ├── WordBank.tsx
│   └── ...
├── utils/             # Utility functions
│   ├── srs.ts         # Spaced repetition logic
│   ├── storage.ts     # LocalStorage helpers
│   └── date.ts        # Date utilities
├── types.ts           # TypeScript definitions
├── App.tsx            # Main app component
└── index.tsx          # Entry point
```

## 🎯 How It Works

1. **Add Words** - Create vocabulary entries with meanings
2. **Organize** - Group words into collections
3. **Review** - Study with flashcards using SRS
4. **Rate Difficulty** - Tell the app how well you knew each word
5. **Master** - Watch your vocabulary grow over time

The app uses the **SM-2 algorithm** to schedule reviews at optimal intervals, helping you retain information in long-term memory.

## 🔧 Configuration

No environment variables required! The app runs entirely client-side.

## 🤝 Contributing

Contributions welcome! Please read the code review report first:
- See [REVIEW_REPORT.md](./REVIEW_REPORT.md) for known issues and improvement areas

## 📝 License

MIT License - feel free to use this project for learning or personal use.

## 🙏 Acknowledgments

- **SuperMemo** - For the SM-2 algorithm
- **Tailwind CSS** - For the amazing utility-first CSS framework
- **Lucide** - For beautiful open-source icons

## 📧 Support

For issues or questions, please open a GitHub issue.

---

**Built with ❤️ using React and TypeScript**

View original AI Studio app: https://ai.studio/apps/drive/1YsmKsxnKd6S5gMGHiHyXhhgVFhiSGU4v
