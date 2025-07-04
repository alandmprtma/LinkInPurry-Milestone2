import express from 'express';
import { authenticateToken } from './index.js'; // Middleware autentikasi
import { pool } from './index.js'; // Koneksi database

const router = express.Router();

// Contoh endpoint: VAPID Public Key
router.get('/api/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Endpoint untuk push subscription
router.post('/api/subscribe', authenticateToken, async (req, res) => {
  const { endpoint, keys } = req.body;
  const userId = req.userId;

  try {
    await pool.query(
      `INSERT INTO push_subscriptions (endpoint, user_id, keys, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (endpoint)
       DO UPDATE SET user_id = $2, keys = $3`,
      [endpoint, userId, JSON.stringify(keys)]
    );
    res.status(200).json({ success: true, message: 'Push subscription saved' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ success: false, message: 'Error saving subscription' });
  }
});

/**
 * @swagger
 * /api/endpoint:
 *   get:
 *     summary: Retrieve a list of items
 *     responses:
 *       200:
 *         description: A list of items.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/api/endpoint', (req, res) => {
  res.json([{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }]);
});

// Ekspor router untuk digunakan di file lain
export default router;
