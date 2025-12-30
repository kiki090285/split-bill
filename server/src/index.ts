import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { calculateBalances, settleDebts, Expense } from './logic';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- MongoDB 連線設定 ---
const mongoURI = process.env.MONGO_URI || ""; 
if (mongoURI) {
  mongoose.connect(mongoURI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));
}

// 定義房間資料結構 (Schema)
const RoomSchema = new mongoose.Schema({
  roomId: { type: String, unique: true, required: true },
  people: { type: [String], default: [] },
  expenses: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // 86400秒 = 24小時後自動刪除
});

const Room = mongoose.model('Room', RoomSchema);

// --- 新增：房間管理路由 ---

// 1. 建立新房間 (產生 6 位數邀請碼)
app.post('/create-room', async (req, res) => {
  try {
    const roomId = Math.random().toString().slice(2, 8); 
    const room = new Room({ roomId });
    await room.save();
    res.json({ roomId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// 2. 獲取房間資料 (加入房間時使用)
app.get('/room/:id', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.id });
    if (room) {
      res.json(room);
    } else {
      res.status(404).json({ error: '找不到該房間，可能已過期' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 3. 同步資料 (有人新增項目時更新資料庫)
app.post('/room/:id/sync', async (req, res) => {
  try {
    const { people, expenses }: { people: string[]; expenses: Expense[] } = req.body;
    const room = await Room.findOneAndUpdate(
      { roomId: req.params.id },
      { people, expenses },
      { new: true }
    );
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

// --- 原本的路由與計算邏輯 (保持不變) ---

app.get('/', (req, res) => {
  res.send('Hello from the server!');
});

app.post('/calculate', (req, res) => {
  try {
    const { people, expenses }: { people: string[]; expenses: Expense[] } = req.body;

    if (!people || !expenses || !Array.isArray(people) || !Array.isArray(expenses)) {
      return res.status(400).json({ error: 'Invalid input. "people" and "expenses" arrays are required.' });
    }
    
    if (people.length === 0) {
      return res.status(400).json({ error: 'The "people" array cannot be empty.' });
    }

    const balances = calculateBalances(expenses, people);
    const transactions = settleDebts(balances);

    res.json({
      balances,
      transactions,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
        res.status(400).json({ error: error.message });
    } else {
        res.status(500).json({ error: 'An unexpected error occurred during calculation.' });
    }
  }
});

app.listen(port, () => {
  console.log(`Server is running at port: ${port}`);
});
