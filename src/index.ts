// src/index.ts
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import marketRouter from './routes/market.route';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'ngrok-skip-browser-warning'
  ],
  credentials: false  // Change to false or remove this line
}));

app.use('/market', marketRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Market service listening on port ${PORT}`);
});
