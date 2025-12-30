import express from 'express';
import cors from 'cors';
import { calculateBalances, settleDebts, Expense } from './logic';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from the server!');
});

app.post('/calculate', (req, res) => {
  try {
    const { people, expenses }: { people: string[]; expenses: Expense[] } = req.body;

    if (!people || !expenses || !Array.isArray(people) || !Array.isArray(expenses)) {
      return res.status(400).json({ error: 'Invalid input. "people" and "expenses" arrays are required.' });
    }
    
    if (people.length === 0) {
      return res.status(400).json({ error: 'The "people" array cannot be empty.' });
    }

    const balances = calculateBalances(expenses, people);
    const transactions = settleDebts(balances);

    res.json({
      balances,
      transactions,
    });
  } catch (error) {
    console.error(error);
    // Check if the error is a known Error instance
    if (error instanceof Error) {
        res.status(400).json({ error: error.message });
    } else {
        res.status(500).json({ error: 'An unexpected error occurred during calculation.' });
    }
  }
});


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
