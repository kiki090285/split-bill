// server/src/logic.ts

export interface Expense {
  description: string;
  amount: number;
  paidBy: string;
  participants: string[];
}

export interface Balance {
  person: string;
  amount: number; // Positive if they are owed money, negative if they owe money
}

export interface Transaction {
  from: string;
  to: string;
  amount: number;
}

export function calculateBalances(expenses: Expense[], people: string[]): Balance[] {
  const balances: { [person: string]: number } = {};

  // Initialize balances for all people
  for (const person of people) {
    balances[person] = 0;
  }

  // Calculate how much each person paid vs. how much they owe
  for (const expense of expenses) {
    if (!people.includes(expense.paidBy)) {
        // Or handle this error more gracefully
        throw new Error(`Payer ${expense.paidBy} is not in the list of people.`);
    }

    // The person who paid gets credit
    balances[expense.paidBy] += expense.amount;

    // The participants owe a share
    const share = expense.amount / expense.participants.length;
    for (const participant of expense.participants) {
        if (!people.includes(participant)) {
            // Or handle this error more gracefully
            throw new Error(`Participant ${participant} is not in the list of people.`);
        }
      balances[participant] -= share;
    }
  }

  // Convert to the Balance[] format
  return Object.entries(balances).map(([person, amount]) => ({
    person,
    amount,
  }));
}

export function settleDebts(balances: Balance[]): Transaction[] {
    const transactions: Transaction[] = [];
    const payers = balances.filter(b => b.amount > 0).sort((a, b) => b.amount - a.amount);
    const owers = balances.filter(b => b.amount < 0).sort((a, b) => a.amount - b.amount);

    let payerIndex = 0;
    let owerIndex = 0;

    while (payerIndex < payers.length && owerIndex < owers.length) {
        const payer = payers[payerIndex];
        const ower = owers[owerIndex];
        const amountToSettle = Math.min(payer.amount, -ower.amount);

        if (amountToSettle > 0.005) { // Avoid tiny floating point transactions
            transactions.push({
                from: ower.person,
                to: payer.person,
                amount: amountToSettle,
            });

            payer.amount -= amountToSettle;
            ower.amount += amountToSettle;
        }

        if (Math.abs(payer.amount) < 0.005) {
            payerIndex++;
        }
        if (Math.abs(ower.amount) < 0.005) {
            owerIndex++;
        }
    }

    return transactions;
}
