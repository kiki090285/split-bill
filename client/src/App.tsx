import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_BASE = "https://split-bill-v9je.onrender.com";

interface Expense {
  description: string;
  amount: number;
  paidBy: string;
  participants: string[];
}

const translations = {
  zh: {
    title: "分帳小幫手 💸",
    createRoom: "建立新群組",
    joinRoom: "加入群組",
    enterRoomId: "輸入 6 位邀請碼",
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
    errorServer: "連線失敗，請檢查後端狀態。"
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

const ResultRow = ({ trans, t }: any) => {
  const [isSaved, setIsSaved] = useState(false);
  return (
    <div style={{ backgroundColor: isSaved ? '#f2f2f7' : '#fff', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #d2d2d7' }}>
      <div style={{ fontSize: '16px', marginBottom: '10px', fontWeight: 'bold', color: '#43302e' }}>
        {trans.from} ➔ {trans.to}: <span style={{ color: '#4a69b3' }}>${trans.amount.toFixed(2)}</span>
      </div>
      <button 
        onClick={() => setIsSaved(!isSaved)} 
        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: isSaved ? '#34c759' : '#43302e', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
        {isSaved ? t.saved : t.saveStatus}
      </button>
    </div>
  );
};

function App() {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const t = translations[lang];

  const [roomId, setRoomId] = useState<string | null>(null);
  const [inputRoomId, setInputRoomId] = useState('');
  const [people, setPeople] = useState<string[]>([]);
  const [newPerson, setNewPerson] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expensePaidBy, setExpensePaidBy] = useState<string>('');
  const [participants, setParticipants] = useState<string[]>([]); 
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const createRoom = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/create-room`, { method: 'POST' });
      const data = await res.json();
      setRoomId(data.roomId);
    } catch (e) { alert(t.errorServer); }
    setIsLoading(false);
  };

  const joinRoom = async () => {
    if (inputRoomId.length !== 6) {
      alert("請輸入完整的 6 位邀請碼");
      return;
    }
    setIsLoading(true);
    try {
      // 確保搜尋時也是大寫
      const res = await fetch(`${API_BASE}/room/${inputRoomId.toUpperCase()}`);
      if (res.ok) {
        const data = await res.json();
        setRoomId(data.roomId);
        setPeople(data.people || []);
        setExpenses(data.expenses || []);
      } else { alert("找不到群組，請確認邀請碼是否正確"); }
    } catch (e) { alert(t.errorServer); }
    setIsLoading(false);
  };

  const syncWithServer = useCallback(async (updatedPeople: string[], updatedExpenses: Expense[]) => {
    if (!roomId) return;
    try {
      await fetch(`${API_BASE}/room/${roomId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people: updatedPeople, expenses: updatedExpenses }),
      });
    } catch (e) { console.error("Sync error:", e); }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/room/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          if (JSON.stringify(data.people) !== JSON.stringify(people)) setPeople(data.people);
          if (JSON.stringify(data.expenses) !== JSON.stringify(expenses)) setExpenses(data.expenses);
        }
      } catch (e) { console.error("Polling error:", e); }
    }, 3000);
    return () => clearInterval(interval);
  }, [roomId, people, expenses]);

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPerson && !people.includes(newPerson)) {
      const updated = [...people, newPerson];
      setPeople(updated);
      setParticipants(updated);
      syncWithServer(updated, expenses);
      setNewPerson('');
    }
  };

  const removePerson = (name: string) => {
    const updated = people.filter(p => p !== name);
    setPeople(updated);
    syncWithServer(updated, expenses);
  };

  const removeExpense = (index: number) => {
    const updated = expenses.filter((_, i) => i !== index);
    setExpenses(updated);
    syncWithServer(people, updated);
  };

  const sectionStyle: React.CSSProperties = { background: '#c1d8e8', padding: '20px', borderRadius: '20px', marginBottom: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d2d2d7', marginBottom: '10px', boxSizing: 'border-box', fontSize: '16px' };
  const mainBtnStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#43302e', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' };

  // -----------------------------------------------------------------
  // 畫面 1：首頁 (未進入群組)
  // -----------------------------------------------------------------
  if (!roomId) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f7', padding: '20px', position: 'relative' }}>
        {/* 右上角語言按鈕 */}
        <button 
          onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} 
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.8)', border: '1px solid #d2d2d7', padding: '4px 10px', borderRadius: '15px', fontSize: '11px', color: '#86868b', cursor: 'pointer' }}>
          {lang === 'zh' ? 'English' : '中文'}
        </button>

        <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <h1 style={{ color: '#43302e', marginBottom: '40px' }}>{t.title}</h1>
          <button onClick={createRoom} style={{ ...mainBtnStyle, padding: '18px', fontSize: '18px', marginBottom: '25px' }}>✨ {t.createRoom}</button>
          
          <div style={{ position: 'relative', height: '1px', backgroundColor: '#d2d2d7', margin: '30px 0' }}>
            <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#f5f5f7', padding: '0 10px', color: '#86868b' }}>或</span>
          </div>
          
          <input 
            placeholder={t.enterRoomId} 
            value={inputRoomId} 
            // 修正：允許輸入英文字母並轉大寫
            onChange={(e) => setInputRoomId(e.target.value.toUpperCase())} 
            maxLength={6}
            style={{ ...inputStyle, textAlign: 'center', fontSize: '24px', letterSpacing: '4px', textTransform: 'uppercase' }} 
          />
          <button onClick={joinRoom} style={{ ...mainBtnStyle, backgroundColor: '#86868b', marginTop: '10px' }}>{t.joinRoom}</button>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // 畫面 2：群組內頁
  // -----------------------------------------------------------------
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7', padding: '20px', position: 'relative' }}>
      {/* 右上角語言按鈕 */}
      <button 
        onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} 
        style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.8)', border: '1px solid #d2d2d7', padding: '4px 10px', borderRadius: '15px', fontSize: '11px', color: '#86868b', cursor: 'pointer', zIndex: 10 }}>
        {lang === 'zh' ? 'English' : '中文'}
      </button>

      <div style={{ maxWidth: '500px', margin: '0 auto', fontFamily: '-apple-system, sans-serif' }}>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'inline-block', backgroundColor: '#43302e', color: 'white', padding: '6px 15px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
            🏠 {t.roomIdIs}{roomId}
          </div>
        </div>

        <section style={sectionStyle}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#43302e' }}>{t.manageMembers}</h2>
          <form onSubmit={handleAddPerson}>
            <input value={newPerson} onChange={(e) => setNewPerson(e.target.value)} placeholder={t.enterName} style={inputStyle} />
            <button type="submit" style={mainBtnStyle}>{t.addMember}</button>
          </form>
          <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {people.map(p => (
              <span key={p} style={{ background: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                {p}
                <button onClick={() => removePerson(p)} style={{ background: 'none', border: 'none', color: '#ff3b30', marginLeft: '6px', fontSize: '18px', cursor: 'pointer' }}>×</button>
              </span>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#43302e' }}>{t.addExpense}</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (expenseDesc && expenseAmount && participants.length > 0) {
              const newExp: Expense = { description: expenseDesc, amount: Number(expenseAmount), paidBy: expensePaidBy || people[0], participants: participants };
              const updated = [...expenses, newExp];
              setExpenses(updated);
              syncWithServer(people, updated);
              setExpenseDesc(''); setExpenseAmount('');
            }
          }}>
            <input placeholder={t.description} value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} style={inputStyle} />
            <input type="number" placeholder={t.amount} value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))} style={inputStyle} />
            
            <div style={{ marginBottom: '15px' }}>
              <span style={{ fontSize: '14px', color: '#43302e', fontWeight: '500' }}>{t.paidBy}</span>
              <select value={expensePaidBy} onChange={(e) => setExpensePaidBy(e.target.value)} style={{ ...inputStyle, marginTop: '5px' }}>
                <option value="">請選擇付款人</option>
                {people.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              <span style={{ fontSize: '14px', color: '#43302e', fontWeight: '500', display: 'block', marginTop: '10px' }}>{t.splitWith}</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
                {people.map(p => (
                  <label key={p} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={participants.includes(p)} onChange={() => setParticipants(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} style={{ marginRight: '5px' }} />
                    {p}
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" style={mainBtnStyle}>{t.addToBill}</button>
          </form>

          <div style={{ marginTop: '20px' }}>
            {expenses.map((exp, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.6)', padding: '10px', borderRadius: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px' }}>📍 {exp.description}: ${exp.amount} ({exp.paidBy})</span>
                <button onClick={() => removeExpense(i)} style={{ border: 'none', background: 'none', color: '#ff3b30', cursor: 'pointer', fontSize: '16px' }}>🗑️</button>
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
          style={{ ...mainBtnStyle, padding: '15px', fontSize: '18px', marginBottom: '40px', backgroundColor: (people.length < 2 || expenses.length === 0) ? '#a1a1a6' : '#43302e' }}
        >
          {isLoading ? t.calculating : t.calculate}
        </button>

        {results && (
          <section style={{ background: '#fff', padding: '20px', borderRadius: '20px', marginBottom: '50px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#43302e' }}>{t.settlementPlan}</h2>
            {results.transactions.map((trans: any, i: number) => <ResultRow key={i} trans={trans} t={t} />)}
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
