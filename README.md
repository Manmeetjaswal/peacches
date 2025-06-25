# EchoForge AI — Your Open-Source Digital Twin Studio

## 🚀 Features
- Create realistic video avatars
- Convert text prompts into videos
- Voice cloning with Fish.audio
- Avatar generation with Stable Diffusion
- Animation with D-ID API
- Cloudinary for video hosting
- YouTube upload integration
- Supabase dashboard & authentication

## 🧩 Tech Stack
- React (Vite + Tailwind)
- FastAPI (Python backend)
- Supabase (auth + database)
- Fish.audio SDK (voice cloning + TTS)
- D-ID API (animation)
- Cloudinary (video storage)
- Hugging Face (image generation)

## ⚙️ Setup Instructions

### Frontend
```bash
cd project
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## 🛡️ Environment Variables
See `.env.example` for all required variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_KEY=
SUPABASE_URL=
SUPABASE_KEY=
FISH_API_KEY=
D_ID_API_KEY=
CLOUDINARY_URL=
GOOGLE_CLIENT_ID=
```

## 🤝 Contributing
Pull requests are welcome! Let's build ethical AI together.

## 📝 License
MIT — free to use, modify, and distribute. 