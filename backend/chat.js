import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { pool } from './index.js'; // Koneksi database
import { sendPushNotification } from './notification.js'; // Notifikasi push fallback

const clients = new Map();

function setupWebSocketServer(server) {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws, req) => {
        let userId = null;
        try {
            const token = req.headers['sec-websocket-protocol'];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = parseInt(decoded.userId, 10);
        } catch (error) {
            console.error('Invalid token:', error.message);
            ws.close();
            return;
        }

        // Simpan koneksi WebSocket
        clients.set(userId, ws);
        console.log(`User ${userId} connected`);

        // Kirim daftar kontak ke pengguna
        sendContactsToUser(ws, userId);

        ws.on('message', async (data) => {
            try {
                const parsedData = JSON.parse(data);

                if (parsedData.type === 'chat') {
                    const { toId, message } = parsedData;

                    // Simpan pesan ke database
                    const result = await pool.query(
                        `INSERT INTO chat (from_id, to_id, message, timestamp)
                         VALUES ($1, $2, $3, $4) RETURNING *`,
                        [userId, toId, message, new Date()]
                    );

                    // Kirim pesan ke penerima jika online
                    const toClient = clients.get(Number(toId));
                    if (toClient) {
                        console.log('Sending real-time chat message...');
                        toClient.send(
                            JSON.stringify({ type: 'chat', ...result.rows[0] })
                        );
                    } else {
                        // Kirim notifikasi push jika penerima tidak online
                        await sendPushNotification(toId, userId, message);
                    }
                } else if (parsedData.type === 'get_history') {
                    const { toId } = parsedData;

                    // Ambil riwayat pesan dari database
                    const history = await pool.query(
                        `SELECT * FROM chat
                         WHERE (from_id = $1 AND to_id = $2)
                         OR (from_id = $2 AND to_id = $1)
                         ORDER BY timestamp ASC`,
                        [userId, toId]
                    );

                    ws.send(
                        JSON.stringify({
                            type: 'history',
                            chatWith: toId,
                            messages: history.rows,
                        })
                    );
                } else if (parsedData.type === 'typing') {
                    const { toId } = parsedData;

                    // Kirim status "typing" ke penerima jika online
                    const toClient = clients.get(Number(toId));
                    if (toClient) {
                        console.log(`User ${userId} is typing to User ${toId}`);
                        toClient.send(
                            JSON.stringify({
                                type: 'typing',
                                from_id: userId,
                            })
                        );
                    }
                }
            } catch (error) {
                console.error('Error processing message:', error.message);
            }
        });

        ws.on('close', () => {
            clients.delete(userId);
            console.log(`User ${userId} disconnected`);
        });
    });

    console.log('WebSocket server is set up');
}

// Fungsi untuk mengirim daftar kontak ke pengguna
async function sendContactsToUser(ws, userId) {
    try {
        const contacts = await pool.query(
            `SELECT DISTINCT u.id, u.full_name,
                    (SELECT message FROM chat 
                     WHERE (chat.from_id = u.id AND chat.to_id = $1)
                        OR (chat.from_id = $1 AND chat.to_id = u.id)
                     ORDER BY timestamp DESC LIMIT 1) AS lastMessage,
                    (SELECT COUNT(*) FROM chat 
                     WHERE chat.to_id = $1 AND chat.from_id = u.id
                       AND NOT EXISTS (
                           SELECT 1 FROM chat AS c2
                           WHERE c2.id = chat.id
                       )) AS unreadCount
             FROM connection c
             JOIN users u ON (c.from_id = u.id OR c.to_id = u.id)
             WHERE (c.from_id = $1 OR c.to_id = $1) AND u.id != $1`,
            [userId]
        );

        ws.send(
            JSON.stringify({
                type: 'contacts',
                contacts: contacts.rows,
            })
        );
    } catch (error) {
        console.error('Error sending contacts:', error.message);
    }
}

export { setupWebSocketServer };
