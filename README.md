# Intelligent Learning System

Educational platform with quiz management, speech recognition, polling, and AI text summarization.

## Prerequisites

- Node.js (v18+)
- Python (v3.8+)
- MongoDB

## Installation

```bash
download the project 
```

### Backend
```bash
cd back-end
npm install
npm run dev
```

### Frontend
```bash
cd front-end
npm install
npm run dev
```

### AI Summarization
```bash
cd summery
pip install -r requirements.txt
```

## Running

1. Start MongoDB
2. Backend: `cd back-end && npm run dev` (http://localhost:5000)
3. Frontend: `cd front-end && npm run dev` (http://localhost:5173)
4. Test AI: `cd summery && python infer_t5.py --text "Your text"`
