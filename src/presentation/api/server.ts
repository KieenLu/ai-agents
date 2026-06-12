import 'dotenv/config';
import express from 'express';
import { claimRouter } from './routes/claim-routes';

const PORT = 3000;

const app = express();

app.use(express.json());

app.use('/api', claimRouter);

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
  });
});

app.listen(PORT, () => {
  console.log(`Claim Assessment API running on port ${PORT}`);
});