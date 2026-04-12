const request = require('supertest');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('OK'));

describe('Basic Test', () => {
    it('GET / should return 200', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
    });
});