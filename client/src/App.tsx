import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';

const API_BASE = "https://split-bill-v9je.onrender.com"; // 請確認您的 Render 網址

const translations = {
  zh: {
    title: "分帳小幫手 💸",
    createRoom: "建立新群組",
    joinRoom: "加入群組",
    enterRoomId: "輸入 6 位數邀請碼",
    roomIdIs: "邀請碼：",
    manageMembers: "1. 成員管理",
    enterName: "輸入姓名",
    addMember: "新增成員",
    addExpense: "2. 新增支出",
    description: "支出項目",
    amount: "金額",
    paidBy: "付款人：",
    splitWith: "參與平分的人：",
    addToBill: "加入帳單",
    calculate: "幫我算算看！",
    calculating: "計算中...",
    settlementPlan: "結算方案",
    saveStatus: "確認儲存",
    saved: "已儲存 ✓",
    errorServer: "連線失敗，請稍後再試。"
  },
  en: {
    title: "Split Bill Helper 💸",
    createRoom: "Create Room",
    joinRoom: "Join Room",
    enterRoomId: "Enter 6-digit code",
    roomIdIs: "Code: ",
    manageMembers: "1. Members",
    enterName: "Enter name",
    addMember: "Add Member",
    addExpense: "2. Add Expense",
    description: "Description",
    amount: "Amount",
    paidBy: "Paid by:",
    splitWith: "Split with:",
    addToBill: "Add to Bill",
    calculate: "Calculate!",
    calculating: "Calculating...",
    settlementPlan: "Settlement Plan",
    saveStatus: "Confirm",
    saved: "Saved ✓",
    errorServer: "Connection error."
  }
};

// 結算行組件
const ResultRow = ({ trans, t }: any) => {
  const [isSaved, setIsSaved] = useState(false);
  return (
    <div style={{ backgroundColor: isSaved ? '#f2f2f7' : '#fff', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #d2d2d7' }}>
      <div style={{ fontSize: '16px', marginBottom: '10px', fontWeight: 'bold', color: '#43302e' }}>
        {trans.from} ➔ {trans.to}: <span style={{ color: '#4a69b3' }}>${trans.amount.toFixed(2)}</span>
      </div>
      <button 
        onClick={() => setIsSaved(!isSaved)} 
        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: isSaved ? '#34c759' : '#43302e', color: 'white', fontWeight: 'bold' }}>
        {isSaved ? t.saved : t.saveStatus}
      </button>
    </div>
  );
};

function App() {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const t = translations[lang];

  // 房間與同步相關狀態
  const [roomId, setRoomId] = useState<string | null>(null);
  const [inputRoomId, setInputRoomId] = useState('');
  
  // 核心資料
  const [people, setPeople] = useState<string[]>([]);
  const [newPerson, setNewPerson] = useState('');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expensePaidBy, setExpensePaidBy] = useState<string>('');
  const [participants, setParticipants] = useState<string[]>([]); 
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. 建立房間
  const createRoom = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/create-room`, { method: 'POST' });
      const data = await res.json();
      setRoomId(data.roomId);
    } catch (e) { alert(t.errorServer); }
    setIsLoading(false);
  };

  // 2. 加入房間
  const joinRoom = async () => {
    if (inputRoomId.length !== 6) return alert("請輸入正確的 6 位數邀請碼");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/room/${inputRoomId}`);
      if (res.ok) {
        const data = await res.json();
        setRoomId(data.roomId);
        setPeople(data.people || []);
        setExpenses(data.expenses || []);
      } else { alert("找不到該房間"); }
    } catch (e) { alert(t.errorServer); }
    setIsLoading(false);
  };

  // 3. 資料同步 (傳送到後端)
  const syncData = useCallback(async (updatedPeople: string[], updatedExpenses: any[]) => {
    if (!roomId) return;
    try {
      await fetch(`${API_BASE}/room/${roomId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people: updatedPeople, expenses: updatedExpenses }),
      });
    } catch (e) { console.error("Sync error:", e); }
  }, [roomId]);

  // 4. 定時拉取資料 (每 3 秒)
  useEffect(() => {
    if (!roomId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/room/${roomId}`);
        const data = await res.json();
        // 只有在資料真的有變動時才更新，避免輸入框被洗掉
        if (JSON.stringify(data.people) !== JSON.stringify(people)) setPeople(data.people);
        if (JSON.stringify(data.expenses) !== JSON.stringify(expenses)) setExpenses(data.expenses);
      } catch (e) { console.error("Poll error:", e); }
    }, 3000);
    return () => clearInterval(interval);
  }, [roomId, people, expenses]);

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPerson && !people.includes(newPerson)) {
      const updated = [...people, newPerson];
      setPeople(updated);
      setParticipants(updated);
      syncData(updated, expenses);
      setNewPerson('');
    }
  };

  const removePerson = (name: string) => {
    const updated = people.filter(p => p !== name);
    setPeople(updated);
    syncData(updated, expenses);
  };

  const removeExpense = (index: number) => {
    const updated = expenses.filter((_, i) => i !== index);
    setExpenses(updated);
    syncData(people, updated);
  };

  const sectionStyle: React.CSSProperties = { background: '#c1d8e8', padding: '20px', borderRadius: '20px', marginBottom: '20px' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d2d2d7', marginBottom: '10px', boxSizing: 'border-box' };
  const mainBtnStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#43302e', color: 'white', fontWeight: 'bold', cursor: 'pointer' };

  // --- 入口頁面 ---
  if (!roomId) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7', padding: '20px' }}>
        <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <h1 style={{ color: '#43302e', marginBottom: '30px' }}>{t.title}</h1>
          <button onClick={createRoom} style={{ ...mainBtnStyle, marginBottom: '20px', padding: '20px', fontSize: '18px' }}>
            ✨ {t.createRoom}
          </button>
          <div style={{ borderTop: '1px solid #d2d2d7', margin: '20px 0', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#f5f5f7', padding: '0 10px', color: '#86868b' }}>or</span>
          </div>
          <input 
            placeholder={t.enterRoomId} 
            value={inputRoomId} 
            onChange={(e) => setInputRoomId(e.target.value)} 
            style={{ ...inputStyle, textAlign: 'center', fontSize: '20px', letterSpacing: '5px' }} 
          />
          <button onClick={joinRoom} style={{ ...mainBtnStyle, backgroundColor: '#86868b' }}>{t.joinRoom}</button>
        </div>
      </div>
    );
  }

  // --- 主要操作頁面 ---
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7', padding: '20px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', fontFamily: '-apple-system, sans-serif' }}>
        
        {/* 頂部資訊列 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ background: '#43302e', color: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
            🏠 {t.roomIdIs}{roomId}
          </div>
          <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} style={{ background: '#fff', border: '1px solid #d2d2d7', padding: '5px 12px', borderRadius: '20px', fontSize: '12px' }}>
            {lang === 'zh' ? 'EN' : '中文'}
          </button>
        </div>

        <section style={sectionStyle}>
          <h2 style={{ fontSize: '18px', color: '#43302e' }}>{t.manageMembers}</h2>
          <form onSubmit={handleAddPerson}>
            <input value={newPerson} onChange={(e) => setNewPerson(e.target.value)} placeholder={t.enterName} style={inputStyle} />
            <button type="submit" style={mainBtnStyle}>{t.addMember}</button>
          </form>
          <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {people.map(p => (
              <span key={p} style={{ background: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                {p}
                <button onClick={() => removePerson(p)} style={{ background: 'none', border: 'none', color: '#ff3b30', marginLeft: '6px', fontSize: '18px' }}>×</button>
              </span>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ fontSize: '18px', color: '#43302e' }}>{t.addExpense}</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (expenseDesc && expenseAmount && participants.length > 0) {
              const updatedExp = [...expenses, { description: expenseDesc, amount: Number(expenseAmount), paidBy: expensePaidBy || people[0], participants: participants }];
              setExpenses(updatedExp);
              syncData(people, updatedExp);
              setExpenseDesc(''); setExpenseAmount('');
            }
          }}>
            <input placeholder={t.description} value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} style={inputStyle} />
            <input type="number" placeholder={t.amount} value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))} style={inputStyle} />
            
            <span style={{ fontSize: '14px', color: '#43302e' }}>{t.paidBy}</span>
            <select value={expensePaidBy} onChange={(e) => setExpensePaidBy(e.target.value)} style={inputStyle}>
              {people.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <span style={{ fontSize: '14px', color: '#43302e', display: 'block', margin: '10px 0' }}>{t.splitWith}</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
              {people.map(p => (
                <label key={p} style={{ fontSize: '14px', color: '#43302e' }}>
                  <input type="checkbox" checked={participants.includes(p)} onChange={() => setParticipants(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} />
                  {p}
                </label>
              ))}
            </div>
            <button type="submit" style={mainBtnStyle}>{t.addToBill}</button>
          </form>

          <div style={{ marginTop: '20px' }}>
            {expenses.map((exp, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.6)', padding: '8px', borderRadius: '8px', marginBottom: '5px' }}>
                <span style={{ fontSize: '13px' }}>📍 {exp.description}: ${exp.amount} ({exp.paidBy})</span>
                <button onClick={() => removeExpense(i)} style={{ border: 'none', background: 'none', color: '#ff3b30' }}>🗑️</button>
              </div>
            ))}
          </div>
        </section>

        <button 
          onClick={async () => {
            setIsLoading(true);
            try {
              const res = await fetch(`${API_BASE}/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ people, expenses }),
              });
              const data = await res.json();
              setResults(data);
            } catch (e) { alert(t.errorServer); } finally { setIsLoading(false); }
          }} 
          disabled={people.length < 2 || expenses.length === 0 || isLoading} 
          style={{ ...mainBtnStyle, padding: '15px', fontSize: '18px', marginBottom: '40px' }}
        >
          {isLoading ? t.calculating : t.calculate}
        </button>

        {results && (
          <section style={{ background: '#fff', padding: '20px', borderRadius: '20px', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '18px', color: '#43302e' }}>{t.settlementPlan}</h2>
            {results.transactions.map((trans: any, i: number) => <ResultRow key={i} trans={trans} t={t} />)}
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
