import express from 'express';
const app = express();

app.get('/health', (_, res) => res.json({ ok: true }));
app.get('/', (_, res) => res.json({ service: 'users', msg: 'User home' }));
app.get('/me', (_, res) => res.json({ id: 1, name: 'Alice' }));

app.listen(5001, () => console.log('Users service running on 5001'));
