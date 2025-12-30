// 改用 require 語法，這在 CommonJS 環境下最穩定
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { calculateBalances, settleDebts } = require('./logic');

const app = express();
// 免費版 Render 的 Port 必須從環境變數抓取
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- MongoDB 連線 ---
const mongoURI = process.env.MONGO_URI; 

if (mongoURI) {
  mongoose.connect(mongoURI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err: any) => console.error("❌ MongoDB Error:", err)); // 修正 err: any
} else {
  console.warn("⚠️ Warning: MONGO_URI is not defined in Environment Variables");
}

// Schema 定義
const RoomSchema = new mongoose.Schema({
  roomId: { type: String, unique: true, required: true },
  people: { type: [String], default: [] },
  expenses: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now, expires: 86400 }
});

const Room = mongoose.models.Room || mongoose.model('Room', RoomSchema);

// --- 路由 ---

app.get('/', (req: any, res: any) => res.send('Server is running!'));

app.post('/create-room', async (req: any, res: any) => {
  try {
    const roomId = Math.random().toString().slice(2, 8); 
    const room = new Room({ roomId });
    await room.save();
    res.json({ roomId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room' });
  }
});

app.get('/room/:id', async (req: any, res: any) => {
  try {
    const room = await Room.findOne({ roomId: req.params.id });
    if (room) res.json(room);
    else res.status(404).json({ error: 'Room not found' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/room/:id/sync', async (req: any, res: any) => {
  try {
    const { people, expenses } = req.body;
    await Room.findOneAndUpdate({ roomId: req.params.id }, { people, expenses });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Sync failed' });
  }
});

app.post('/calculate', (req: any, res: any) => {
  try {
    const { people, expenses } = req.body;
    const balances = calculateBalances(expenses, people);
    const transactions = settleDebts(balances);
    res.json({ balances, transactions });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
