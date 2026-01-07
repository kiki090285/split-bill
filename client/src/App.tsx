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
    copied: "已複製邀請碼！",
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
    saveStatus: "確認付款",
    saved: "已付款 ✓",
    errorServer: "連線失敗，請檢查後端狀態。"
  },
  en: {
    title: "Split Bill Helper 💸",
    createRoom: "Create Room",
    joinRoom: "Join Room",
    enterRoomId: "Enter 6-digit code",
    roomIdIs: "Code: ",
    copied: "Code Copied!",
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
    saveStatus: "Mark as Paid",
    saved: "Paid ✓",
    errorServer: "Connection error."
  }
};

const ResultRow = ({ trans, t, isPaid, onToggle }: any) => {
  return (
    <div style={{ 
      backgroundColor: isPaid ? '#f2f2f7' : '#fff', 
      padding: '15px', borderRadius: '12px', marginBottom: '10px', 
      border: '1px solid #d2d2d7', transition: 'all 0.3s ease'
    }}>
      <div style={{ fontSize: '16px', marginBottom: '10px', fontWeight: 'bold', color: '#43302e' }}>
        {trans.from} ➔ {trans.to}: <span style={{ color: '#4a69b3' }}>${trans.amount.toFixed(2)}</span>
      </div>
      <button onClick={onToggle} style={{ 
        width: '100%', padding: '12px', borderRadius: '8px', border: 'none', 
        backgroundColor: isPaid ? '#34c759' : '#43302e', color: 'white', fontWeight: 'bold', cursor: 'pointer'
      }}>
        {isPaid ? t.saved : t.saveStatus}
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
  const [paidTransactions, setPaidTransactions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  // 支出表單狀態
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expensePaidBy, setExpensePaidBy] = useState<string>('');
  const [participants, setParticipants] = useState<string[]>([]);

  const sectionStyle: React.CSSProperties = { background: '#c1d8e8', padding: '20px', borderRadius: '20px', marginBottom: '20px' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d2d2d7', marginBottom: '10px', boxSizing: 'border-box' };
  const mainBtnStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#43302e', color: 'white', fontWeight: 'bold', cursor: 'pointer' };

  const syncWithServer = useCallback(async (updatedPeople: string[], updatedExpenses: Expense[], updatedPaid: string[]) => {
    if (!roomId) return;
    try {
      await fetch(`${API_BASE}/room/${roomId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people: updatedPeople, expenses: updatedExpenses, paidTransactions: updatedPaid }),
      });
    } catch (e) { console.error(e); }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/room/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          setPeople(data.people || []);
          setExpenses(data.expenses || []);
          setPaidTransactions(data.paidTransactions || []);
        }
      } catch (e) { console.error(e); }
    }, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPerson && !people.includes(newPerson)) {
      const updated = [...people, newPerson];
      setPeople(updated);
      syncWithServer(updated, expenses, paidTransactions);
      setNewPerson('');
    }
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseDesc && expenseAmount && expensePaidBy) {
      const selectedParticipants = participants.length > 0 ? participants : people;
      const newExp = { description: expenseDesc, amount: Number(expenseAmount), paidBy: expensePaidBy, participants: selectedParticipants };
      const updated = [...expenses, newExp];
      setExpenses(updated);
      syncWithServer(people, updated, paidTransactions);
      // 只清空輸入框，不影響 list
      setExpenseDesc(''); setExpenseAmount(''); setParticipants([]);
    }
  };

  if (!roomId) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f7', padding: '20px' }}>
        <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <h1>{t.title}</h1>
          <button onClick={async () => {
            setIsLoading(true);
            const res = await fetch(`${API_BASE}/create-room`, { method: 'POST' });
            const data = await res.json();
            setRoomId(data.roomId);
            setIsLoading(false);
          }} style={mainBtnStyle}>✨ {t.createRoom}</button>
          <div style={{ margin: '20px 0' }}>或</div>
          <input placeholder={t.enterRoomId} value={inputRoomId} onChange={(e) => setInputRoomId(e.target.value.toUpperCase())} maxLength={6} style={{ ...inputStyle, textAlign: 'center' }} />
          <button onClick={async () => {
            setIsLoading(true);
            const res = await fetch(`${API_BASE}/room/${inputRoomId}`);
            if (res.ok) { setRoomId(inputRoomId); } else { alert("找不到群組"); }
            setIsLoading(false);
          }} style={{ ...mainBtnStyle, backgroundColor: '#86868b' }}>{t.joinRoom}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f7', padding: '20px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {/* 頂部切換語言與邀請碼 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
           <div style={{ backgroundColor: '#43302e', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '14px' }}>
            🏠 {t.roomIdIs}{roomId}
          </div>
          <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} style={{ background: 'none', border: '1px solid #43302e', borderRadius: '15px', cursor: 'pointer', padding: '4px 10px' }}>
            🌐 {lang === 'zh' ? 'English' : '中文'}
          </button>
        </div>

        <section style={sectionStyle}>
          <h2>{t.manageMembers}</h2>
          <form onSubmit={handleAddPerson} style={{ display: 'flex', gap: '10px' }}>
            <input value={newPerson} onChange={(e) => setNewPerson(e.target.value)} placeholder={t.enterName} style={{ ...inputStyle, marginBottom: 0 }} />
            <button type="submit" style={{ ...mainBtnStyle, width: 'auto' }}>{t.addMember}</button>
          </form>
          <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {people.map(p => (
              <span key={p} style={{ background: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '14px' }}>
                {p} <button onClick={() => {
                  const updated = people.filter(x => x !== p);
                  setPeople(updated);
                  syncWithServer(updated, expenses, paidTransactions);
                }} style={{ border: 'none', color: '#ff3b30', background: 'none', cursor: 'pointer' }}>×</button>
              </span>
            ))}
          </div>
        </section>

        <section style={{ ...sectionStyle, background: '#e2eafc' }}>
          <h2>{t.addExpense}</h2>
          <form onSubmit={handleAddExpense}>
            <input value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} placeholder={t.description} style={inputStyle} />
            <input type="number" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder={t.amount} style={inputStyle} />
            <select value={expensePaidBy} onChange={(e) => setExpensePaidBy(e.target.value)} style={inputStyle}>
              <option value="">-- {t.paidBy} --</option>
              {people.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontWeight: 'bold', fontSize: '14px' }}>{t.splitWith}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {people.map(p => (
                  <label key={p} style={{ background: participants.includes(p) ? '#43302e' : '#fff', color: participants.includes(p) ? '#fff' : '#000', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', border: '1px solid #d2d2d7' }}>
                    <input type="checkbox" checked={participants.includes(p)} onChange={() => setParticipants(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} style={{ display: 'none' }} />
                    {p}
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" style={mainBtnStyle}>{t.addToBill}</button>
          </form>
          
          {/* 顯示已加入的清單 */}
          <div style={{ marginTop: '15px' }}>
            {expenses.map((exp, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.4)', padding: '10px', borderRadius: '8px', marginBottom: '5px', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{exp.description}: <b>${exp.amount}</b> (由 {exp.paidBy} 付)</span>
                <button onClick={() => {
                  const up = expenses.filter((_, idx) => idx !== i);
                  setExpenses(up); syncWithServer(people, up, paidTransactions);
                }} style={{ border: 'none', color: '#ff3b30', background: 'none', cursor: 'pointer' }}>×</button>
              </div>
            ))}
          </div>
        </section>

        <button onClick={async () => {
          setIsLoading(true);
          const res = await fetch(`${API_BASE}/calculate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ people, expenses }), });
          const data = await res.json();
          setResults(data);
          setIsLoading(false);
        }} style={{ ...mainBtnStyle, marginBottom: '40px' }}>
          {isLoading ? t.calculating : t.calculate}
        </button>

        {results && (
          <section style={{ background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>{t.settlementPlan}</h2>
            {results.transactions.map((trans: any, i: number) => {
              const transId = `${trans.from}-${trans.to}-${trans.amount.toFixed(2)}`;
              return <ResultRow key={i} trans={trans} t={t} isPaid={paidTransactions.includes(transId)} onToggle={() => {
                const newPaid = paidTransactions.includes(transId) ? paidTransactions.filter(id => id !== transId) : [...paidTransactions, transId];
                setPaidTransactions(newPaid); syncWithServer(people, expenses, newPaid);
              }} />;
            })}
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
