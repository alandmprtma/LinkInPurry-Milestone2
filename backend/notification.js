import webpush from 'web-push';
import { pool } from './index.js'; // Import koneksi database

// Konfigurasi VAPID
webpush.setVapidDetails(
    'mailto:example@yourdomain.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

async function sendPushNotification(userId, fromId, messageContent) {
    try {
      // Ambil nama pengguna pengirim
      const senderResult = await pool.query(
        `SELECT full_name FROM users WHERE id = $1`,
        [fromId]
      );
  
      if (senderResult.rows.length === 0) {
        console.error(`Sender not found with ID ${fromId}`);
        return;
      }
  
      const senderName = senderResult.rows[0].full_name;
  
      // Ambil subscription untuk penerima
      const subscriptionResult = await pool.query(
        `SELECT endpoint, keys FROM push_subscriptions WHERE user_id = $1`,
        [userId]
      );
  
      const subscription = subscriptionResult.rows[0];
      if (subscription) {
        const payload = JSON.stringify({
          type: "chat", // Tipe notifikasi
          message: `${senderName} sent you a message: "${messageContent}"`,
          contactId: fromId, // ID pengguna yang mengirim pesan (untuk navigasi)
        });

        console.log("payload", payload);
  
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        };
  
        await webpush.sendNotification(pushSubscription, payload);
        console.log(`Push notification sent to user ${userId}`);
      } else {
        console.log(`No push subscription found for user ${userId}`);
      }
    } catch (error) {
      console.error('Error sending push notification:', error.message);
    }
  }
  

  async function sendNewPostNotification(userId, postContent, postId) {
    try {
      // Ambil nama pengguna pembuat postingan
      const userResult = await pool.query(
        `SELECT full_name FROM users WHERE id = $1`,
        [userId]
      );
  
      if (userResult.rows.length === 0) {
        console.error(`User not found with ID ${userId}`);
        return;
      }
  
      const userName = userResult.rows[0].full_name;
  
      // Ambil semua koneksi pengguna
      const connections = await pool.query(
        `SELECT to_id FROM connection WHERE from_id = $1`,
        [userId]
      );
  
      for (const connection of connections.rows) {
        const toId = connection.to_id;
  
        // Ambil subscription untuk koneksi
        const subscriptionResult = await pool.query(
          `SELECT endpoint, keys FROM push_subscriptions WHERE user_id = $1`,
          [toId]
        );
  
        if (subscriptionResult.rows.length > 0) {
          const payload = JSON.stringify({
            type: "post", // Tipe notifikasi
            message: `${userName} created a new post: "${postContent}"`,
            postId: postId, // ID postingan (untuk navigasi)
          });

          console.log('payload', payload);
  
          const pushSubscription = {
            endpoint: subscriptionResult.rows[0].endpoint,
            keys: subscriptionResult.rows[0].keys,
          };
  
          await webpush.sendNotification(pushSubscription, payload);
          console.log(`Post notification sent to user ${toId}`);
        }
      }
    } catch (error) {
      console.error('Error sending post notification:', error.message);
    }
  }
  

// Endpoint untuk menyimpan push subscription
function registerPushEndpoints(app, authenticateToken) {
    app.post('/api/subscribe', authenticateToken, async (req, res) => {
        const userId = req.userId;
        const { endpoint, keys } = req.body;

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
            res.status(500).json({ success: false, message: 'Error saving push subscription', error: error.message });
        }
    });
}

export { sendPushNotification, sendNewPostNotification, registerPushEndpoints };
