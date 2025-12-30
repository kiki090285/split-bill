import React, { useState, useMemo } from 'react';
import './App.css';

// --- 支援中英雙語 ---
const translations = {
  zh: {
    title: "分帳小幫手 💸",
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
    errorServer: "無法連接伺服器。"
  },
  en: {
    title: "Split Bill Helper 💸",
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
    errorServer: "Server error."
  }
};

const ResultRow = ({ trans, t }: any) => {
  const [isSaved, setIsSaved] = useState(false);
  return (
    <div style={{ backgroundColor: isSaved ? '#f2f2f7' : '#fff', padding: '15px', borderRadius: '12px', marginBottom: '10px', border: '1px solid #d2d2d7' }}>
      <div style={{ fontSize: '16px', marginBottom: '10px', fontWeight: 'bold' }}>
        {trans.from} ➔ {trans.to}: <span style={{ color: '#4a69b3' }}>${trans.amount.toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <select disabled={isSaved} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d2d2d7', fontSize: '14px' }}>
          <option value="pending">⏳ {t.saveStatus === "Confirm" ? "Pending" : "未付款"}</option>
          <option value="paid">✅ {t.saveStatus === "Confirm" ? "Paid" : "已付款"}</option>
        </select>
        <select disabled={isSaved} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d2d2d7', fontSize: '14px' }}>
          <option value="line">🟢 LINE Pay</option>
          <option value="jkopay">🔴 街口支付</option>
          <option value="transfer">🏦 轉帳 / Bank</option>
          <option value="cash">💵 現金 / Cash</option>
        </select>
      </div>
      <button onClick={() => setIsSaved(!isSaved)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: isSaved ? '#34c759' : '#4a69b3', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
        {isSaved ? t.saved : t.saveStatus}
      </button>
    </div>
  );
};

function App() {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const t = translations[lang];
  
  const [people, setPeople] = useState<string[]>([]);
  const [newPerson, setNewPerson] = useState('');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expensePaidBy, setExpensePaidBy] = useState<string>('');
  const [participants, setParticipants] = useState<string[]>([]); 
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isReadyToCalculate = useMemo(() => people.length > 1 && expenses.length > 0, [people, expenses]);

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPerson && !people.includes(newPerson)) {
      const updated = [...people, newPerson];
      setPeople(updated);
      setParticipants(updated);
      if (!expensePaidBy) setExpensePaidBy(newPerson);
      setNewPerson('');
    }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d2d2d7', marginBottom: '10px', boxSizing: 'border-box', fontSize: '16px' };
  const buttonStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#4a69b3', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, sans-serif' }}>
      {/* 語言切換按鈕 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} style={{ background: 'none', border: '1px solid #d2d2d7', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', color: '#86868b', cursor: 'pointer' }}>
          {lang === 'zh' ? 'English' : '中文'}
        </button>
      </div>

      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>{t.title}</h1>

      <section style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>{t.manageMembers}</h2>
        <form onSubmit={handleAddPerson}>
          <input value={newPerson} onChange={(e) => setNewPerson(e.target.value)} placeholder={t.enterName} style={inputStyle} />
          <button type="submit" style={buttonStyle}>{t.addMember}</button>
        </form>
        <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {people.map(p => <span key={p} style={{ background: '#f2f2f7', padding: '5px 10px', borderRadius: '15px', fontSize: '13px' }}>{p}</span>)}
        </div>
      </section>

      <section style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>{t.addExpense}</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (expenseDesc && expenseAmount && participants.length > 0) {
            setExpenses([...expenses, { description: expenseDesc, amount: Number(expenseAmount), paidBy: expensePaidBy || people[0], participants: participants }]);
            setExpenseDesc(''); setExpenseAmount('');
          }
        }}>
          <input placeholder={t.description} value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} style={inputStyle} />
          <input type="number" placeholder={t.amount} value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))} style={inputStyle} />
          
          <div style={{ marginBottom: '15px' }}>
            <span style={{ fontSize: '14px', color: '#86868b' }}>{t.paidBy}</span>
            <select value={expensePaidBy} onChange={(e) => setExpensePaidBy(e.target.value)} style={{ ...inputStyle, marginBottom: '15px' }}>
              {people.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <span style={{ fontSize: '14px', color: '#86868b', display: 'block', marginBottom: '8px' }}>{t.splitWith}</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
              {people.map(p => (
                <label key={p} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" checked={participants.includes(p)} onChange={() => setParticipants(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} style={{ marginRight: '5px' }} />
                  {p}
                </label>
              ))}
            </div>
          </div>
          <button type="submit" style={buttonStyle}>{t.addToBill}</button>
        </form>

        {expenses.map((exp, i) => (
          <div key={i} style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
            📍 {exp.description}: ${exp.amount} ({exp.paidBy})
          </div>
        ))}
      </section>

      <button onClick={async () => {
        setIsLoading(true);
        try {
          const res = await fetch('https://split-bill-v9je.onrender.com/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ people, expenses }),
          });
          const data = await res.json();
          setResults(data);
        } catch (e) { alert(t.errorServer); } finally { setIsLoading(false); }
      }} disabled={!isReadyToCalculate || isLoading} style={{ ...buttonStyle, backgroundColor: isReadyToCalculate ? '#4a69b3' : '#a1a1a6', padding: '15px', fontSize: '18px' }}>
        {isLoading ? t.calculating : t.calculate}
      </button>

      {results && (
        <section style={{ background: '#f5f5f7', padding: '20px', borderRadius: '16px', marginTop: '20px', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>{t.settlementPlan}</h2>
          {results.transactions.map((trans: any, i: number) => <ResultRow key={i} trans={trans} t={t} />)}
        </section>
      )}
    </div>
  );
}

export default App;
