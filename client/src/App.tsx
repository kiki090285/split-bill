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
    calculate: "Calculate Settlement",
    calculating: "Calculating...",
    settlementPlan: "Settlement Plan",
    allSettled: "Everything is settled!",
    errorServer: "Server error. Please check backend.",
    involvedAlert: "This person is involved in expenses and cannot be deleted!"
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
    calculate: "開始計算",
    calculating: "計算中...",
    settlementPlan: "結算方案",
    allSettled: "大家互不相欠！",
    errorServer: "無法連接伺服器，請檢查後端。",
    involvedAlert: "該成員已有相關支出，無法刪除！"
  }
};

function App() {
  // 語系狀態：'en' 或 'zh'
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
      const response = await fetch('http://localhost:3000/calculate', {
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
    <div className="container">
      {/* 語系切換按鈕 */}
      <div style={{ textAlign: 'right' }}>
        <button className="lang-btn" onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}>
          {lang === 'en' ? '中文' : 'English'}
        </button>
      </div>

      <h1>{t.title}</h1>

      <section className="form-section">
        <h2>{t.manageMembers}</h2>
        <form onSubmit={handleAddPerson}>
          <input value={newPerson} onChange={(e) => setNewPerson(e.target.value)} placeholder={t.enterName} />
          <button type="submit">{t.addMember}</button>
        </form>
        <div className="chip-container">
          {people.map(p => (
            <span key={p} className="chip">{p} <button onClick={() => handleDeletePerson(p)}>×</button></span>
          ))}
        </div>
      </section>

      <section className="form-section">
        <h2>{t.addExpense}</h2>
        <form onSubmit={handleAddExpense}>
          <input placeholder={t.description} value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} />
          <input type="number" placeholder={t.amount} value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))} />
          <div>{t.paidBy} <select value={expensePaidBy} onChange={(e) => setExpensePaidBy(e.target.value)}>{people.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          <div className="participants">
            {t.splitBetween}
            {people.map(p => (
              <label key={p}><input type="checkbox" checked={expenseParticipants.includes(p)} onChange={() => setExpenseParticipants(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} /> {p}</label>
            ))}
          </div>
          <button type="submit">{t.addToBill}</button>
        </form>
      </section>

      <section className="list-section">
        <h2>{t.expenseList}</h2>
        {expenses.map((ex, i) => (
          <div key={i} className="expense-item">
            {ex.description}: ${ex.amount} ({t.paidByText} {ex.paidBy})
            <button onClick={() => setExpenses(expenses.filter((_, idx) => idx !== i))}>{t.delete}</button>
          </div>
        ))}
        <button className="calc-btn" onClick={handleCalculate} disabled={!isReadyToCalculate}>
          {isLoading ? t.calculating : t.calculate}
        </button>
      </section>

      {results && (
        <section className="result-section">
          <h2>{t.settlementPlan}</h2>
          {results.transactions.length === 0 ? <p>{t.allSettled}</p> : 
            results.transactions.map((t: any, i: number) => (
              <div key={i} className="result-item"><strong>{t.from}</strong> ➔ <strong>{t.to}</strong>: ${t.amount.toFixed(2)}</div>
            ))
          }
        </section>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default App;