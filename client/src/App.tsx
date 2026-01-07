import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_BASE = "https://split-bill-v9je.onrender.com";

interface Expense {
  description: string;
  amount: number;
  paidBy: string;
  participants: string[];
}

interface BankInfo {
  bankName: string;
  account: string;
}

const translations = {
  zh: {
    title: "分帳小幫手 💸",
    createRoom: "建立新群組",
    joinRoom: "加入群組",
    enterRoomId: "輸入 6 位邀請碼",
    roomIdIs: "邀請碼：",
    copied: "已複製！",
    manageMembers: "1. 成員管理",
    enterName: "輸入姓名",
    addMember: "新增",
    addExpense: "2. 新增支出",
    expenseList: "📝 支出明細",
    description: "支出項目",
    amount: "金額",
    paidBy: "付款人",
    splitWith: "參與平分的人：",
    addToBill: "加入帳單",
    calculate: "幫我算算看！",
    calculating: "計算中...",
    settlementPlan: "結算方案",
    saveStatus: "確認付款",
    saved: "已完成 ✓",
    bankTitle: "設定收款資訊",
    bankNameLabel: "銀行名稱/代碼",
    accountLabel: "銀行帳號",
    copyBtn: "複製帳號",
    noBankInfo: "尚未設定帳號",
    whoSplit: "分攤者："
  },
  en: {
    title: "Split Bill Helper 💸",
    createRoom: "Create Room",
    joinRoom: "Join Room",
    enterRoomId: "Enter 6-digit code",
    roomIdIs: "Code: ",
    copied: "Copied!",
    manageMembers: "1. Members",
    enterName: "Enter name",
    addMember: "Add",
    addExpense: "2. Add Expense",
    expenseList: "📝 Expenses",
    description: "Description",
    amount: "Amount",
    paidBy: "Paid by",
    splitWith: "Split with:",
    addToBill: "Add to Bill",
    calculate: "Calculate!",
    calculating: "Calculating...",
    settlementPlan: "Settlement Plan",
    saveStatus: "Confirm",
    saved: "Done ✓",
    bankTitle: "Bank Settings",
    bankNameLabel: "Bank/Code",
    accountLabel: "Account",
    copyBtn: "Copy Info",
    noBankInfo: "No bank info",
    whoSplit: "Splitters:"
  }
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
  const [bankAccounts, setBankAccounts] = useState<Record<string, BankInfo>>({}); 
  const [showBankModal, setShowBankModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expensePaidBy, setExpensePaidBy] = useState<string>('');
  const [participants, setParticipants] = useState<string[]>([]);

  const [isTyping, setIsTyping] = useState(false);

  // 樣式
  const sectionStyle: React.CSSProperties = { background: '#c1d8e8', padding: '20px', borderRadius: '20px', marginBottom: '20px' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d2d2d7', marginBottom: '10px', boxSizing: 'border-box' };
  const mainBtnStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#43302e', color: 'white', fontWeight: 'bold', cursor: 'pointer' };
  const smallBtnStyle: React.CSSProperties = { flex: 1, padding: '10px 5px', fontSize: '13px', borderRadius: '10px', border: '1px solid #43302e', background: '#fff', cursor: 'pointer', fontWeight: 'bold', textAlign: 'center' };

  const syncWithServer = useCallback(async (currentPeople: string[], currentExpenses: Expense[], currentPaid: string[], currentBanks: any) => {
    if (!roomId) return;
    try {
      await fetch(`${API_BASE}/room/${roomId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people: currentPeople, expenses: currentExpenses, paidTransactions: currentPaid, bankAccounts: currentBanks }),
      });
    } catch (e) { console.error(e); }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const interval = setInterval(async () => {
      if (isTyping) return; 
      try {
        const res = await fetch(`${API_BASE}/room/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          setPeople(data.people || []);
          setExpenses(data.expenses || []);
          setPaidTransactions(data.paidTransactions || []);
          setBankAccounts(data.bankAccounts || {});
        }
      } catch (e) { console.error(e); }
    }, 3000);
    return () => clearInterval(interval);
  }, [roomId, isTyping]);

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPerson && !people.includes(newPerson)) {
      const updated = [...people, newPerson];
      setPeople(updated);
      syncWithServer(updated, expenses, paidTransactions, bankAccounts);
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
      syncWithServer(people, updated, paidTransactions, bankAccounts);
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
      <div style={{ maxWidth: '500px', margin: '0 auto', paddingBottom: '50px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#43302e', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '14px' }}>🏠 {t.roomIdIs}{roomId}</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowBankModal(true)} style={{ background: '#fff', border: '1px solid #43302e', borderRadius: '15px', cursor: 'pointer', padding: '6px 12px' }}>🏦</button>
            <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} style={{ background: '#fff', border: '1px solid #43302e', borderRadius: '15px', cursor: 'pointer', padding: '6px 12px' }}>🌐 {lang === 'zh' ? 'En' : '中'}</button>
          </div>
        </div>

        {/* 修正後的銀行資訊 Modal */}
        {showBankModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '25px', width: '85%', maxWidth: '350px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ textAlign: 'center', marginTop: 0 }}>{t.bankTitle}</h3>
              <div style={{ overflowY: 'auto', flex: 1, marginBottom: '15px' }}>
                {people.length === 0 ? <p style={{textAlign:'center', color:'#888'}}>請先新增成員</p> : people.map(person => (
                  <div key={person} style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>👤 {person}</div>
                    <input 
                      placeholder={t.bankNameLabel} 
                      value={bankAccounts[person]?.bankName || ''} 
                      onFocus={() => setIsTyping(true)}
                      onBlur={() => setIsTyping(false)}
                      onChange={(e) => setBankAccounts({...bankAccounts, [person]: {...(bankAccounts[person]||{account:''}), bankName: e.target.value}})} 
                      style={{ ...inputStyle, padding: '8px', fontSize: '13px', marginBottom: '5px' }} 
                    />
                    <input 
                      placeholder={t.accountLabel} 
                      value={bankAccounts[person]?.account || ''} 
                      onFocus={() => setIsTyping(true)}
                      onBlur={() => setIsTyping(false)}
                      onChange={(e) => setBankAccounts({...bankAccounts, [person]: {...(bankAccounts[person]||{bankName:''}), account: e.target.value}})} 
                      style={{ ...inputStyle, padding: '8px', fontSize: '13px', marginBottom: 0 }} 
                    />
                  </div>
                ))}
              </div>
              <button onClick={() => { syncWithServer(people, expenses, paidTransactions, bankAccounts); setShowBankModal(false); }} style={mainBtnStyle}>OK</button>
            </div>
          </div>
        )}

        <section style={sectionStyle}>
          <h2 style={{ fontSize: '18px' }}>{t.manageMembers}</h2>
          <form onSubmit={handleAddPerson} style={{ display: 'flex', gap: '8px' }}>
            <input value={newPerson} onChange={(e) => setNewPerson(e.target.value)} placeholder={t.enterName} style={{ ...inputStyle, marginBottom: 0 }} />
            <button type="submit" style={{ ...mainBtnStyle, width: 'auto', whiteSpace: 'nowrap' }}>{t.addMember}</button>
          </form>
          <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {people.map(p => (
              <span key={p} style={{ background: '#fff', padding: '5px 10px', borderRadius: '15px', fontSize: '13px' }}>
                {p} <button onClick={() => { const updated = people.filter(x => x !== p); setPeople(updated); syncWithServer(updated, expenses, paidTransactions, bankAccounts); }} style={{ border: 'none', color: '#ff3b30', background: 'none', cursor: 'pointer' }}>×</button>
              </span>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ fontSize: '18px' }}>{t.addExpense}</h2>
          <form onSubmit={handleAddExpense}>
            <input value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} placeholder={t.description} style={inputStyle} />
            <input type="number" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder={t.amount} style={inputStyle} />
            <select value={expensePaidBy} onChange={(e) => setExpensePaidBy(e.target.value)} style={inputStyle}>
              <option value="">-- {t.paidBy} --</option>
              {people.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontWeight: 'bold', fontSize: '13px' }}>{t.splitWith}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {people.map(p => (
                  <label key={p} style={{ background: participants.includes(p) ? '#43302e' : '#fff', color: participants.includes(p) ? '#fff' : '#000', padding: '5px 10px', borderRadius: '15px', fontSize: '11px', cursor: 'pointer', border: '1px solid #d2d2d7' }}>
                    <input type="checkbox" checked={participants.includes(p)} onChange={() => setParticipants(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} style={{ display: 'none' }} />
                    {p}
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" style={mainBtnStyle}>{t.addToBill}</button>
          </form>
        </section>

        <button onClick={async () => {
          setIsLoading(true);
          const res = await fetch(`${API_BASE}/calculate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ people, expenses }), });
          const data = await res.json();
          setResults(data);
          setIsLoading(false);
          setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100);
        }} style={{ ...mainBtnStyle, marginBottom: '30px' }}>
          {isLoading ? t.calculating : t.calculate}
        </button>

        {/* 結算結果 */}
        {results && (
          <section id="results" style={{ background: '#fff', padding: '20px', borderRadius: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px', textAlign: 'center' }}>{t.settlementPlan}</h2>
            {results.transactions.map((trans: any, i: number) => {
              const transId = `${trans.from}-${trans.to}-${trans.amount.toFixed(2)}`;
              const isPaid = paidTransactions.includes(transId);
              const targetBank = bankAccounts[trans.to];
              const hasBankInfo = targetBank && (targetBank.bankName || targetBank.account);

              return (
                <div key={i} style={{ backgroundColor: isPaid ? '#f8f9fa' : '#fff', padding: '15px', borderRadius: '18px', marginBottom: '15px', border: `1px solid ${isPaid ? '#e0e0e0' : '#eee'}` }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
                    {trans.from} ➔ {trans.to}: <span style={{ color: '#4a69b3', fontSize: '16px' }}>${trans.amount.toFixed(2)}</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {/* 複製按鈕：永遠保留，若沒設定則提示去設定 */}
                    <button 
                      onClick={() => { 
                        if (hasBankInfo) {
                          navigator.clipboard.writeText(`${targetBank.bankName} ${targetBank.account}`); 
                          alert(t.copied); 
                        } else {
                          setShowBankModal(true);
                        }
                      }} 
                      style={{...smallBtnStyle, color: hasBankInfo ? '#43302e' : '#888'}}
                    >
                      📋 {hasBankInfo ? t.copyBtn : t.noBankInfo}
                    </button>
                    
                    {/* 付款按鈕：跟複製按鈕一樣大 */}
                    <button onClick={() => {
                      const newPaid = isPaid ? paidTransactions.filter(id => id !== transId) : [...paidTransactions, transId];
                      setPaidTransactions(newPaid);
                      syncWithServer(people, expenses, newPaid, bankAccounts);
                    }} style={{ 
                      ...smallBtnStyle, 
                      backgroundColor: isPaid ? '#4caf50' : '#43302e', 
                      color: 'white', 
                      border: 'none' 
                    }}>
                      {isPaid ? t.saved : t.saveStatus}
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
