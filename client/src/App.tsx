import React, { useState, useMemo } from 'react';
import './App.css';

// --- 翻譯對照表 ---
const translations = {
  en: {
    title: "Splitwise Helper 💸",
    manageMembers: "1. Manage Members",
    enterName: "Enter name",
    addMember: "Add Member",
    addExpense: "2. Add Expense",
    description: "Description",
    amount: "Amount",
    paidBy: "Paid By:",
    splitBetween: "Split Between:",
    addToBill: "Add to Bill",
    expenseList: "3. Expense List",
    paidByText: "Paid by",
    delete: "Delete",
    calculate: "Help me calculate!",
    calculating: "Calculating...",
    settlementPlan: "Settlement Plan",
    allSettled: "Everything is settled!",
    errorServer: "Server error. Please check backend.",
    involvedAlert: "This person is involved in expenses and cannot be deleted!",
    saveStatus: "Confirm Save",
    saved: "Saved ✓"
  },
  zh: {
    title: "分帳小幫手 💸",
    manageMembers: "1. 成員管理",
    enterName: "輸入姓名",
    addMember: "新增成員",
    addExpense: "2. 新增支出",
    description: "支出項目",
    amount: "金額",
    paidBy: "付款人：",
    splitBetween: "分攤成員：",
    addToBill: "加入帳單",
    expenseList: "3. 支出清單",
    paidByText: "由",
    delete: "刪除",
    calculate: "幫我算算看！",
    calculating: "計算中...",
    settlementPlan: "結算方案",
    allSettled: "大家互不相欠！",
    errorServer: "無法連接伺服器，請檢查後端。",
    involvedAlert: "該成員已有相關支出，無法刪除！",
    saveStatus: "確認儲存",
    saved: "已儲存 ✓"
  }
};

// 獨立的結果卡片組件，用來管理每一筆的儲存狀態
const ResultCard = ({ trans, lang, t }: any) => {
  const [isSaved, setIsSaved] = useState(false);

  return (
    <div className="result-card" style={{ 
      backgroundColor: isSaved ? '#f2f2f7' : '#fff',
      opacity: isSaved ? 0.7 : 1,
      padding: '15px',
      borderRadius: '12px',
      marginBottom: '10px',
      border: '1px solid #d2d2d7',
      transition: 'all 0.3s ease'
    }}>
      <div className="result-text" style={{ fontSize: '16px', marginBottom: '10px' }}>
        <strong>{trans.from}</strong> ➔ <strong>{trans.to}</strong>: 
        <span style={{ color: '#0071e3', fontWeight: 'bold' }}> ${trans.amount.toFixed(2)}</span>
      </div>
      
      <div className="payment-controls" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <select className="status-select" disabled={isSaved} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #d2d2d7' }}>
          <option value="pending">⏳ {lang === 'zh' ? '未付款' : 'Pending'}</option>
          <option value="paid">✅ {lang === 'zh' ? '已付款' : 'Paid'}</option>
        </select>
        <select className="method-select" disabled={isSaved} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #d2d2d7' }}>
          <option value="cash">💵 {lang === 'zh' ? '現金' : 'Cash'}</option>
          <option value="line">🟢 Line Pay</option>
          <option value="transfer">🏦 {lang === 'zh' ? '轉帳' : 'Transfer'}</option>
        </select>
      </div>

      <button 
        onClick={() => setIsSaved(!isSaved)}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '10px',
          border: 'none',
          backgroundColor: isSaved ? '#34c759' : '#1d1d1f',
          color: 'white',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'background-color 0.3s'
        }}
      >
        {isSaved ? t.saved : t.saveStatus}
      </button>
    </div>
  );
};

function App() {
  const [lang, setLang] = useState<'en' | 'zh'>('zh');
  const t = translations[lang];

  const [people, setPeople] = useState<string[]>([]);
  const [newPerson, setNewPerson] = useState('');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expensePaidBy, setExpensePaidBy] = useState<string>('');
  const [expenseParticipants, setExpenseParticipants] = useState<string[]>([]);
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReadyToCalculate = useMemo(() => people.length > 1 && expenses.length > 0, [people, expenses]);

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPerson && !people.includes(newPerson)) {
      setPeople([...people, newPerson]);
      if (!expensePaidBy) setExpensePaidBy(newPerson);
      if (expenseParticipants.length === 0) setExpenseParticipants([newPerson]);
      setNewPerson('');
    }
  };

  const handleDeletePerson = (p: string) => {
    const isInvolved = expenses.some(ex => ex.paidBy === p || ex.participants.includes(p));
    if (isInvolved) { alert(t.involvedAlert); return; }
    const updated = people.filter(person => person !== p);
    setPeople(updated);
    if (expensePaidBy === p) setExpensePaidBy(updated[0] || '');
    setResults(null);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseDesc && expenseAmount) {
      setExpenses([...expenses, {
        description: expenseDesc,
        amount: Number(expenseAmount),
        paidBy: expensePaidBy,
        participants: expenseParticipants,
      }]);
      setExpenseDesc('');
      setExpenseAmount('');
      setResults(null);
    }
  };

  const handleCalculate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('https://split-bill-v9je.onrender.com/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people, expenses }),
      });
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(t.errorServer);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="container" style={{ maxWidth: '500px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <div style={{ textAlign: 'right' }}>
        <button className="lang-btn" onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} style={{ background: 'none', border: '1px solid #d2d2d7', borderRadius: '20px', padding: '5px 15px', cursor: 'pointer' }}>
          {lang === 'en' ? '中文' : 'English'}
        </button>
      </div>

      <h1 style={{ textAlign: 'center', color: '#1d1d1f', marginBottom: '30px' }}>{t.title}</h1>

      {/* 1. 成員管理 */}
      <section className="form-section" style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>{t.manageMembers}</h2>
        <form onSubmit={handleAddPerson} style={{ display: 'flex', gap: '10px' }}>
          <input value={newPerson} onChange={(e) => setNewPerson(e.target.value)} placeholder={t.enterName} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #d2d2d7' }} />
          <button type="submit" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#0071e3', color: 'white', fontWeight: 'bold' }}>{t.addMember}</button>
        </form>
        <div className="chip-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '15px' }}>
          {people.map(p => (
            <span key={p} className="chip" style={{ background: '#e8e8ed', padding: '5px 12px', borderRadius: '15px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {p} <button onClick={() => handleDeletePerson(p)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>×</button>
            </span>
          ))}
        </div>
      </section>

      {/* 2. 新增支出 */}
      <section className="form-section" style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>{t.addExpense}</h2>
        <form onSubmit={handleAddExpense}>
          <input placeholder={t.description} value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #d2d2d7', marginBottom: '10px', boxSizing: 'border-box' }} />
          <input type="number" placeholder={t.amount} value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #d2d2d7', marginBottom: '10px', boxSizing: 'border-box' }} />
          <div style={{ marginBottom: '10px' }}>
            <span>{t.paidBy} </span>
            <select value={expensePaidBy} onChange={(e) => setExpensePaidBy(e.target.value)} style={{ padding: '5px', borderRadius: '8px' }}>
              {people.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="participants" style={{ marginBottom: '15px' }}>
            <p style={{ fontSize: '14px', color: '#86868b' }}>{t.splitBetween}</p>
            {people.map(p => (
              <label key={p} style={{ marginRight: '10px', fontSize: '14px' }}>
                <input type="checkbox" checked={expenseParticipants.includes(p)} onChange={() => setExpenseParticipants(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} />
                {p}
              </label>
            ))}
          </div>
          <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#1d1d1f', color: 'white', fontWeight: 'bold' }}>{t.addToBill}</button>
        </form>
      </section>

      {/* 3. 支出清單 */}
      <section className="list-section" style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>{t.expenseList}</h2>
        {expenses.map((ex, i) => (
          <div key={i} className="expense-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f2f2f7' }}>
            <span>{ex.description}: <strong>${ex.amount}</strong> <small>({t.paidByText} {ex.paidBy})</small></span>
            <button onClick={() => setExpenses(expenses.filter((_, idx) => idx !== i))} style={{ color: '#ff3b30', border: 'none', background: 'none', cursor: 'pointer' }}>{t.delete}</button>
          </div>
        ))}
        <button 
          onClick={handleCalculate} 
          disabled={!isReadyToCalculate || isLoading}
          style={{ width: '100%', marginTop: '20px', padding: '15px', borderRadius: '14px', border: 'none', backgroundColor: isReadyToCalculate ? '#0071e3' : '#a1a1a6', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
        >
          {isLoading ? t.calculating : t.calculate}
        </button>
      </section>

      {/* 結算結果 */}
      {results && (
        <section className="result-section" style={{ background: '#f5f5f7', padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>{t.settlementPlan}</h2>
          {results.transactions.length === 0 ? <p>{t.allSettled}</p> : 
            results.transactions.map((trans: any, i: number) => (
              <ResultCard key={i} trans={trans} lang={lang} t={t} />
            ))
          }
        </section>
      )}
      {error && <p className="error" style={{ color: '#ff3b30', textAlign: 'center' }}>{error}</p>}
    </div>
  );
}

export default App;
