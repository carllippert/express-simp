const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const request = require('supertest');
const simp = require('../index');
const fs = require('fs');
const path = require('path');

describe('express-simp middleware', () => {
  describe('basic functionality', () => {
    let app;

    before(() => {
      app = express();
      app.use(simp());
      app.get('/json', (req, res) => { res.json({ ok: true }); });
      app.get('/text', (req, res) => { res.type('text/plain').send('Hello'); });
      app.get('/no-content', (req, res) => { res.status(204).send(); });
    });

    it('should add X-Encouragement header to response', async () => {
      const res = await request(app).get('/json');
      assert.ok(res.headers['x-encouragement'], 'X-Encouragement header should be present');
      assert.strictEqual(typeof res.headers['x-encouragement'], 'string');
    });

    it('should add encouragement field to JSON response', async () => {
      const res = await request(app).get('/json');
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.encouragement, 'encouragement field should be present');
      assert.strictEqual(typeof res.body.encouragement, 'string');
      assert.strictEqual(res.body.ok, true);
    });

    it('should use same message for header and body', async () => {
      const res = await request(app).get('/json');
      assert.strictEqual(res.headers['x-encouragement'], res.body.encouragement);
    });

    it('should add header to text responses', async () => {
      const res = await request(app).get('/text');
      assert.ok(res.headers['x-encouragement']);
      assert.strictEqual(res.text, 'Hello');
    });

    it('should add header to 204 No Content responses', async () => {
      const res = await request(app).get('/no-content');
      assert.strictEqual(res.status, 204);
      assert.ok(res.headers['x-encouragement']);
    });
  });

  describe('custom options', () => {
    it('should use custom header name', async () => {
      const app = express();
      app.use(simp({ header: 'X-KeepGoing' }));
      app.get('/', (req, res) => res.json({ ok: true }));
      const res = await request(app).get('/');
      assert.ok(res.headers['x-keepgoing']);
      assert.strictEqual(res.headers['x-encouragement'], undefined);
    });

    it('should use custom field name', async () => {
      const app = express();
      app.use(simp({ field: 'nudge' }));
      app.get('/', (req, res) => res.json({ ok: true }));
      const res = await request(app).get('/');
      assert.ok(res.body.nudge);
      assert.strictEqual(res.body.encouragement, undefined);
    });

    it('should not overwrite existing field by default', async () => {
      const app = express();
      app.use(simp());
      app.get('/', (req, res) => res.json({ ok: true, encouragement: 'existing' }));
      const res = await request(app).get('/');
      assert.strictEqual(res.body.encouragement, 'existing');
    });

    it('should overwrite existing field when overwrite is true', async () => {
      const app = express();
      app.use(simp({ overwrite: true }));
      app.get('/', (req, res) => res.json({ ok: true, encouragement: 'existing' }));
      const res = await request(app).get('/');
      assert.notStrictEqual(res.body.encouragement, 'existing');
      assert.ok(res.body.encouragement);
    });

    it('should not add to body when disableBody is true', async () => {
      const app = express();
      app.use(simp({ disableBody: true }));
      app.get('/', (req, res) => res.json({ ok: true }));
      const res = await request(app).get('/');
      assert.ok(res.headers['x-encouragement']);
      assert.strictEqual(res.body.encouragement, undefined);
    });

    it('should load custom messages file', async () => {
      const testFile = path.join(__dirname, 'test-bag.txt');
      fs.writeFileSync(testFile, 'custom message\n');
      const app = express();
      app.use(simp({ file: testFile }));
      app.get('/', (req, res) => res.json({ ok: true }));
      const res = await request(app).get('/');
      assert.strictEqual(res.body.encouragement, 'custom message');
      assert.strictEqual(res.headers['x-encouragement'], 'custom message');
      fs.unlinkSync(testFile);
    });
  });

  describe('message loading', () => {
    it('should ignore comments and blank lines', async () => {
      const testFile = path.join(__dirname, 'test-comments.txt');
      fs.writeFileSync(testFile, '# comment\n\nmessage one\n  \nmessage two\n');
      const app = express();
      app.use(simp({ file: testFile }));
      app.get('/', (req, res) => res.json({ ok: true }));
      const messages = new Set();
      for (let i = 0; i < 20; i++) {
        const res = await request(app).get('/');
        messages.add(res.body.encouragement);
      }
      assert.ok(messages.has('message one') || messages.has('message two'));
      assert.ok(!Array.from(messages).some(m => m.includes('#')));
      fs.unlinkSync(testFile);
    });

    it('should throw error if no messages found', () => {
      const testFile = path.join(__dirname, 'test-empty.txt');
      fs.writeFileSync(testFile, '# only comments\n\n');
      assert.throws(() => { simp({ file: testFile }); }, /No encouragement messages found/);
      fs.unlinkSync(testFile);
    });
  });

  describe('middleware signature', () => {
    it('should return a middleware function', () => {
      const middleware = simp();
      assert.strictEqual(typeof middleware, 'function');
      assert.strictEqual(middleware.length, 3);
    });

    it('should call next()', async () => {
      const app = express();
      let nextCalled = false;
      app.use(simp());
      app.use((req, res, next) => { nextCalled = true; next(); });
      app.get('/', (req, res) => res.json({ ok: true }));
      await request(app).get('/');
      assert.strictEqual(nextCalled, true);
    });
  });
});
