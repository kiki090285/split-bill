import React, { useState, useMemo } from 'react';
import './App.css';

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
    addToBill: "加入帳單",
    calculate: "幫我算算看！",
    calculating: "計算中...",
    settlementPlan: "結算方案",
    saveStatus: "確認儲存",
    saved: "已儲存 ✓",
    errorServer: "無法連接伺服器，請檢查後端。"
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
        <select disabled={isSaved} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d2d2d7' }}>
          <option value="pending">⏳ 未付款</option>
          <option value="paid">✅ 已付款</option>
        </select>
        <select disabled={isSaved} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d2d2d7' }}>
          <option value="line">🟢 Line Pay</option>
          <option value="cash">💵 現金</option>
          <option value="transfer">🏦 轉帳</option>
        </select>
      </div>
      <button onClick={() => setIsSaved(!isSaved)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: isSaved ? '#34c759' : '#4a69b3', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
        {isSaved ? t.saved : t.saveStatus}
      </button>
    </div>
  );
};

function App() {
  const t = translations.zh;
  const [people, setPeople] = useState<string[]>([]);
  const [newPerson, setNewPerson] = useState('');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expensePaidBy, setExpensePaidBy] = useState<string>('');
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isReadyToCalculate = useMemo(() => people.length > 1 && expenses.length > 0, [people, expenses]);

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPerson && !people.includes(newPerson)) {
      setPeople([...people, newPerson]);
      if (!expensePaidBy) setExpensePaidBy(newPerson);
      setNewPerson('');
    }
  };

  const removePerson = (name: string) => setPeople(people.filter(p => p !== name));
  const removeExpense = (index: number) => setExpenses(expenses.filter((_, i) => i !== index));

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseDesc && expenseAmount) {
      setExpenses([...expenses, { description: expenseDesc, amount: Number(expenseAmount), paidBy: expensePaidBy || people[0], participants: people }]);
      setExpenseDesc('');
      setExpenseAmount('');
    }
  };

  const handleCalculate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://split-bill-v9je.onrender.com/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people, expenses }),
      });
      const data = await response.json();
      setResults(data);
    } catch (err) { alert(t.errorServer); } finally { setIsLoading(false); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d2d2d7', marginBottom: '10px', boxSizing: 'border-box', fontSize: '16px' };
  const buttonStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#4a69b3', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px', fontFamily: '-apple-system, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>{t.title}</h1>

      {/* 1. 成員管理 */}
      <section style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>{t.manageMembers}</h2>
        <form onSubmit={handleAddPerson} style={{ marginBottom: '15px' }}>
          <input value={newPerson} onChange={(e) => setNewPerson(e.target.value)} placeholder={t.enterName} style={inputStyle} />
          <button type="submit" style={buttonStyle}>{t.addMember}</button>
        </form>
        {/* 補回成員清單 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {people.map(p => (
            <span key={p} style={{ background: '#f2f2f7', padding: '6px 12px', borderRadius: '20px', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
              {p} <button onClick={() => removePerson(p)} style={{ background: 'none', border: 'none', color: '#ff3b30', marginLeft: '5px', cursor: 'pointer' }}>×</button>
            </span>
          ))}
        </div>
      </section>

      {/* 2. 新增支出 */}
      <section style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>{t.addExpense}</h2>
        <form onSubmit={handleAddExpense}>
          <input placeholder={t.description} value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} style={inputStyle} />
          <input type="number" placeholder={t.amount} value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))} style={inputStyle} />
          <div style={{ marginBottom: '15px' }}>
            <span style={{ fontSize: '14px', color: '#86868b' }}>{t.paidBy}</span>
            <select value={expensePaidBy} onChange={(e) => setExpensePaidBy(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }}>
              {people.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button type="submit" style={buttonStyle}>{t.addToBill}</button>
        </form>
        {/* 補回支出明細 */}
        <div style={{ marginTop: '15px' }}>
          {expenses.map((exp, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f2f2f7', fontSize: '14px' }}>
              <span>{exp.description} ({exp.paidBy})</span>
              <span>${exp.amount} <button onClick={() => removeExpense(i)} style={{ color: '#ff3b30', border: 'none', background: 'none', cursor: 'pointer' }}>×</button></span>
            </div>
          ))}
        </div>
      </section>

      <button onClick={handleCalculate} disabled={!isReadyToCalculate || isLoading} style={{ ...buttonStyle, backgroundColor: isReadyToCalculate ? '#4a69b3' : '#a1a1a6', padding: '15px', fontSize: '18px' }}>
        {isLoading ? t.calculating : t.calculate}
      </button>

      {results && (
        <section style={{ background: '#f5f5f7', padding: '20px', borderRadius: '16px', marginTop: '20px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>{t.settlementPlan}</h2>
          {results.transactions.map((trans: any, i: number) => (
            <ResultRow key={i} trans={trans} t={t} />
          ))}
        </section>
      )}
    </div>
  );
}

export default App;
