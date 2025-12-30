// server/src/logic.ts

// 這裡保留 interface 定義給 TypeScript 檢查
export interface Expense {
  description: string;
  amount: number;
  paidBy: string;
  participants: string[];
}

export interface Balance {
  person: string;
  amount: number;
}

export interface Transaction {
  from: string;
  to: string;
  amount: number;
}

// 修改函式宣告，移除前面的 export
function calculateBalances(expenses: Expense[], people: string[]): Balance[] {
  const balances: { [person: string]: number } = {};
  for (const person of people) {
    balances[person] = 0;
  }
  for (const expense of expenses) {
    if (!people.includes(expense.paidBy)) {
      throw new Error(`Payer ${expense.paidBy} is not in the list of people.`);
    }
    balances[expense.paidBy] += expense.amount;
    const share = expense.amount / expense.participants.length;
    for (const participant of expense.participants) {
      if (!people.includes(participant)) {
        throw new Error(`Participant ${participant} is not in the list of people.`);
      }
      balances[participant] -= share;
    }
  }
  return Object.entries(balances).map(([person, amount]) => ({ person, amount }));
}

function settleDebts(balances: Balance[]): Transaction[] {
  const transactions: Transaction[] = [];
  const payers = balances.filter(b => b.amount > 0).sort((a, b) => b.amount - a.amount);
  const owers = balances.filter(b => b.amount < 0).sort((a, b) => a.amount - b.amount);
  let payerIndex = 0;
  let owerIndex = 0;
  while (payerIndex < payers.length && owerIndex < owers.length) {
    const payer = payers[payerIndex];
    const ower = owers[owerIndex];
    const amountToSettle = Math.min(payer.amount, -ower.amount);
    if (amountToSettle > 0.005) {
      transactions.push({
        from: ower.person,
        to: payer.person,
        amount: amountToSettle,
      });
      payer.amount -= amountToSettle;
      ower.amount += amountToSettle;
    }
    if (Math.abs(payer.amount) < 0.005) payerIndex++;
    if (Math.abs(ower.amount) < 0.005) owerIndex++;
  }
  return transactions;
}

// 🔴 最關鍵的一步：使用 CommonJS 匯出
module.exports = { calculateBalances, settleDebts };
