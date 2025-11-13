import express from 'express';
const app = express();

//req parameter is not required ignore request
app.get('/health', (_, res) => res.json({ ok: true }));
app.get('/', (_, res) => res.json({ service: 'orders', msg: 'Order home' }));
app.get('/list', (_, res) => res.json([{ id: 101, item: 'Book' }]));

app.listen(5002, () => console.log('Orders service running on 5002'));
