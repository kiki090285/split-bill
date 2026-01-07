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
    roomIdIs: "群組邀請碼：",
    copied: "邀請碼已複製！",
    manageMembers: "1. 成員管理",
    bankSettings: "🏦 收款帳號設定 (選填)",
    enterName: "輸入姓名",
    addMember: "新增成員",
    addExpense: "2. 新增支出",
    description: "項目 (如：晚餐)",
    amount: "金額",
    paidBy: "付款人：",
    addToBill: "加入帳單",
    calculate: "幫我算算看！",
    calculating: "計算中...",
    settlementPlan: "結算方案",
    saveStatus: "確認付款",
    saved: "已付款 ✓",
    errorServer: "連線失敗，請檢查網路狀態。"
  },
  en: {
    title: "Split Bill Helper 💸",
    createRoom: "Create Room",
    joinRoom: "Join Room",
    enterRoomId: "Enter 6-digit code",
    roomIdIs: "Room Code: ",
    copied: "Code Copied!",
    manageMembers: "1. Members",
    bankSettings: "🏦 Bank Transfer Settings",
    enterName: "Enter name",
    addMember: "Add",
    addExpense: "2. Add Expense",
    description: "Item (e.g. Dinner)",
    amount: "Amount",
    paidBy: "Paid by:",
    addToBill: "Add to Bill",
    calculate: "Calculate!",
    calculating: "Processing...",
    settlementPlan: "Settlement Plan",
    saveStatus: "Mark as Paid",
    saved: "Paid ✓",
    errorServer: "Connection error."
  }
};

const ResultRow = ({ trans, t, isPaid, onToggle, bankInfo }: any) => {
  const copyBank = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!bankInfo.account) return alert("請先在上方設定帳號");
    navigator.clipboard.writeText(bankInfo.account);
    alert(`已複製 ${trans.to} 的帳號！`);
  };

  return (
    <div style={{ 
      backgroundColor: isPaid ? '#f2f2f7' : '#fff', 
      padding: '20px', borderRadius: '18px', marginBottom: '15px', 
      border: '1px solid #d2d2d7', transition: '0.3s'
    }}>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1d1d1f' }}>
        {trans.from} ➔ {trans.to}
        <div style={{ color: '#0071e3', fontSize: '24px', margin: '5px 0' }}>
          ${trans.amount.toFixed(2)}
        </div>
      </div>

      {!isPaid && bankInfo.account && (
        <div style={{ 
          background: '#f5f5f7', padding: '12px', borderRadius: '12px', 
          margin: '10px 0', border: '1px dashed #d2d2d7', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ fontSize: '13px' }}>
            <strong>{bankInfo.name} ({bankInfo.code})</strong><br/>
            <code>{bankInfo.account}</code>
          </div>
          <button onClick={copyBank} style={{ border: '1px solid #0071e3', color: '#0071e3', background: '#fff', borderRadius: '15px', padding: '4px 12px', cursor: 'pointer' }}>複製</button>
        </div>
      )}

      <button onClick={onToggle} style={{ 
        width: '100%', padding: '12px', borderRadius: '10px', border: 'none', 
        backgroundColor: isPaid ? '#34c759' : '#1d1d1f', color: 'white', fontWeight: 'bold', cursor: 'pointer' 
      }}>
        {isPaid ? t.saved : t.saveStatus}
      </button>
    </div>
  );
};

function App() {
  const [lang] = useState<'zh' | 'en'>('zh'); // 移除 setLang 以修正錯誤
  const t = translations[lang];

  const [roomId, setRoomId] = useState<string | null>(null);
  const [inputRoomId, setInputRoomId] = useState('');
  const [people, setPeople] = useState<string[]>([]);
  const [newPerson, setNewPerson] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [paidTransactions, setPaidTransactions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const [myBankInfo, setMyBankInfo] = useState({ name: "中國信託", code: "822", account: "" });
  const [showBankSettings, setShowBankSettings] = useState(false);

  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expensePaidBy, setExpensePaidBy] = useState('');

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
      const res = await fetch(`${API_BASE}/room/${roomId}`);
      if (res.ok) {
        const data = await res.json();
        setPeople(data.people || []);
        setExpenses(data.expenses || []);
        setPaidTransactions(data.paidTransactions || []);
      }
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
      const updated = [...expenses, { description: expenseDesc, amount: Number(expenseAmount), paidBy: expensePaidBy, participants: people }];
      setExpenses(updated);
      syncWithServer(people, updated, paidTransactions);
      setExpenseDesc(''); setExpenseAmount('');
    }
  };

  const sectionStyle: React.CSSProperties = { background: '#fff', padding: '20px', borderRadius: '24px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #d2d2d7', marginBottom: '10px', boxSizing: 'border-box', fontSize: '16px' };
  const darkBtnStyle: React.CSSProperties = { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#1d1d1f', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' };

  if (!roomId) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f7' }}>
        <div style={{ maxWidth: '360px', width: '90%', textAlign: 'center' }}>
          <h1>{t.title}</h1>
          <button onClick={async () => {
            setIsLoading(true);
            const res = await fetch(`${API_BASE}/create-room`, { method: 'POST' });
            const data = await res.json();
            setRoomId(data.roomId);
            setIsLoading(false);
          }} style={darkBtnStyle}>✨ {t.createRoom}</button>
          <div style={{ margin: '20px', color: '#86868b' }}>或</div>
          <input placeholder={t.enterRoomId} value={inputRoomId} onChange={(e) => setInputRoomId(e.target.value.toUpperCase())} maxLength={6} style={{ ...inputStyle, textAlign: 'center' }} />
          <button onClick={async () => {
            setIsLoading(true);
            const res = await fetch(`${API_BASE}/room/${inputRoomId}`);
            if (res.ok) {
              const data = await res.json();
              setRoomId(data.roomId);
            } else { alert("找不到房間"); }
            setIsLoading(false);
          }} style={{ ...darkBtnStyle, backgroundColor: '#86868b' }}>{t.joinRoom}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ background: '#1d1d1f', color: '#fff', padding: '8px 16px', borderRadius: '20px' }}>🏠 {t.roomIdIs}{roomId}</div>
        <button onClick={() => {navigator.clipboard.writeText(roomId); alert(t.copied);}} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>📋</button>
      </div>

      <section style={sectionStyle}>
        <h3>{t.manageMembers}</h3>
        <form onSubmit={handleAddPerson} style={{ display: 'flex', gap: '8px' }}>
          <input value={newPerson} onChange={(e) => setNewPerson(e.target.value)} placeholder={t.enterName} style={{ ...inputStyle, marginBottom: 0 }} />
          <button type="submit" style={{ ...darkBtnStyle, width: 'auto', whiteSpace: 'nowrap' }}>{t.addMember}</button>
        </form>
        <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {people.map(p => (
            <span key={p} style={{ background: '#f5f5f7', padding: '6px 14px', borderRadius: '20px', fontSize: '14px' }}>
              {p} <button onClick={() => {const up = people.filter(x => x !== p); setPeople(up); syncWithServer(up, expenses, paidTransactions);}} style={{ border: 'none', color: '#ff3b30', background: 'none', cursor: 'pointer' }}>×</button>
            </span>
          ))}
        </div>
      </section>

      <section style={{ ...sectionStyle, background: '#f5f5f7', border: '1px solid #d2d2d7' }}>
        <div onClick={() => setShowBankSettings(!showBankSettings)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>{t.bankSettings}</h3>
          <span>{showBankSettings ? '−' : '+'}</span>
        </div>
        {showBankSettings && (
          <div style={{ marginTop: '15px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input placeholder="銀行名" value={myBankInfo.name} onChange={(e) => setMyBankInfo({...myBankInfo, name: e.target.value})} style={inputStyle} />
              <input placeholder="代碼" value={myBankInfo.code} onChange={(e) => setMyBankInfo({...myBankInfo, code: e.target.value})} style={inputStyle} />
            </div>
            <input placeholder="帳號" value={myBankInfo.account} onChange={(e) => setMyBankInfo({...myBankInfo, account: e.target.value})} style={inputStyle} />
          </div>
        )}
      </section>

      <section style={sectionStyle}>
        <h3>{t.addExpense}</h3>
        <form onSubmit={handleAddExpense}>
          <input placeholder={t.description} value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} style={inputStyle} />
          <input type="number" placeholder={t.amount} value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))} style={inputStyle} />
          <div style={{ marginBottom: '10px' }}>
            {t.paidBy} 
            <select value={expensePaidBy} onChange={(e) => setExpensePaidBy(e.target.value)} style={inputStyle}>
              <option value="">選擇付款人</option>
              {people.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button type="submit" style={darkBtnStyle}>{t.addToBill}</button>
        </form>
      </section>

      <button onClick={async () => {
        setIsLoading(true);
        const res = await fetch(`${API_BASE}/calculate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ people, expenses }), });
        const data = await res.json();
        setResults(data);
        setIsLoading(false);
      }} style={{ ...darkBtnStyle, marginBottom: '40px', backgroundColor: '#0071e3' }}>
        {isLoading ? t.calculating : t.calculate}
      </button>

      {results && (
        <section style={{ background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>{t.settlementPlan}</h2>
          {results.transactions.map((trans: any, i: number) => {
            const transId = `${trans.from}-${trans.to}-${trans.amount.toFixed(2)}`;
            return (
              <ResultRow key={i} trans={trans} t={t} bankInfo={myBankInfo} isPaid={paidTransactions.includes(transId)} onToggle={() => {
                const isNowPaid = paidTransactions.includes(transId);
                const newPaid = isNowPaid ? paidTransactions.filter(id => id !== transId) : [...paidTransactions, transId];
                setPaidTransactions(newPaid);
                syncWithServer(people, expenses, newPaid);
              }} />
            );
          })}
        </section>
      )}
    </div>
  );
}

export default App;
