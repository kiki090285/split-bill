const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 加入這個，讓您點開網址時不會看到空白
app.get('/', (req: any, res: any) => {
  res.send('✅ 後端伺服器已成功啟動！');
});

// 為了保證 API 能被前端呼叫，請確認這行存在
app.use(cors());

// --- MongoDB 連線 ---
const mongoURI = process.env.MONGO_URI; 

if (mongoURI) {
  mongoose.connect(mongoURI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err: any) => console.error("❌ MongoDB Error:", err));
}

// --- 資料庫模型 ---
const RoomSchema = new mongoose.Schema({
  roomId: { type: String, unique: true, required: true },
  people: { type: [String], default: [] },
  expenses: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now, expires: 86400 }
});
const Room = mongoose.models.Room || mongoose.model('Room', RoomSchema);

// --- 內建計算邏輯 (避免匯入問題) ---
function calculateBalances(expenses: any[], people: string[]) {
  const balances: any = {};
  people.forEach(p => balances[p] = 0);
  expenses.forEach(exp => {
    balances[exp.paidBy] += exp.amount;
    const share = exp.amount / exp.participants.length;
    exp.participants.forEach((p: string) => balances[p] -= share);
  });
  return Object.entries(balances).map(([person, amount]) => ({ person, amount }));
}

function settleDebts(balances: any[]) {
  const transactions: any[] = [];
  const payers = balances.filter(b => b.amount > 0).sort((a, b) => b.amount - a.amount);
  const owers = balances.filter(b => b.amount < 0).sort((a, b) => a.amount - b.amount);
  let i = 0, j = 0;
  while (i < payers.length && j < owers.length) {
    const amt = Math.min(payers[i].amount, -owers[j].amount);
    if (amt > 0.01) {
      transactions.push({ from: owers[j].person, to: payers[i].person, amount: amt });
      payers[i].amount -= amt;
      owers[j].amount += amt;
    }
    if (payers[i].amount < 0.01) i++;
    if (owers[j].amount > -0.01) j++;
  }
  return transactions;
}

// --- 路由 ---
app.get('/', (req: any, res: any) => {
  res.send('✅ Split Bill Server is Running!');
});

app.post('/create-room', async (req: any, res: any) => {
  try {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = new Room({ roomId, people: [], expenses: [] });
    await room.save();
    res.json({ roomId });
  } catch (error: any) {
    // 關鍵：這行會讓你在瀏覽器看到真正的報錯原因
    res.status(500).json({ error: error.message });
  }
});

app.get('/room/:id', async (req: any, res: any) => {
  try {
    // 強制將輸入轉為大寫，確保跟資料庫存的一致
    const roomId = req.params.id.toUpperCase();
    const room = await Room.findOne({ roomId: roomId });
    
    if (room) {
      res.json(room);
    } else {
      res.status(404).json({ error: '找不到該群組，請檢查邀請碼是否正確' });
    }
  } catch (error) {
    res.status(500).json({ error: '伺服器錯誤' });
  }
});

app.post('/room/:id/sync', async (req: any, res: any) => {
  try {
    const { people, expenses } = req.body;
    await Room.findOneAndUpdate({ roomId: req.params.id }, { people, expenses });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Sync Failed' });
  }
});

app.post('/calculate', (req: any, res: any) => {
  const { people, expenses } = req.body;
  const balances = calculateBalances(expenses, people);
  const transactions = settleDebts(balances);
  res.json({ transactions });
});

app.listen(port, () => {
  console.log(`🚀 Server ready on port ${port}`);
});
