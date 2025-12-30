const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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
    const roomId = Math.random().toString().slice(2, 8); 
    const room = new Room({ roomId });
    await room.save();
    res.json({ roomId });
  } catch (error) {
    res.status(500).json({ error: 'Create Room Failed' });
  }
});

app.get('/room/:id', async (req: any, res: any) => {
  try {
    const room = await Room.findOne({ roomId: req.params.id });
    if (room) res.json(room);
    else res.status(404).json({ error: 'Not Found' });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
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
