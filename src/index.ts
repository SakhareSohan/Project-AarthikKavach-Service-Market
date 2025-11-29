// src/index.ts
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import marketRouter from './routes/market.route';

const app = express();
app.use(express.json());

app.use('/market', marketRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Market service listening on port ${PORT}`);
});
