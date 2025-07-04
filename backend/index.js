import 'dotenv/config'; // Load environment variables
import express from 'express';
import cors from 'cors'; // Middleware untuk menangani CORS
import cookieParser from 'cookie-parser'; // Middleware untuk parsing cookies
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import http from 'http';
import multer from 'multer';
import { setupWebSocketServer } from './chat.js';
import { registerPushEndpoints,sendNewPostNotification } from './notification.js';
import router from './routes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger-output.json' assert { type: 'json' };

const { Pool } = pg;

const app = express();

//swagga
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// Middleware
app.use(express.json()); // Parsing JSON di body request
app.use(cookieParser()); // Parsing cookies di request
app.use(cors({
    origin: 'http://localhost:5173', // Ganti dengan domain frontend Anda
    credentials: true, // Untuk mengizinkan cookie di permintaan cross-origin
}));

// Buat server HTTP dan gunakan Express sebagai handler
const server = http.createServer(app);

setupWebSocketServer(server);
registerPushEndpoints(app, authenticateToken);

//Storage in courtesy of multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "frontend/public/pfp"); // Directory to store uploaded files
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName); // Unique file name to avoid conflicts
    },
});

// Initialize multer middleware
const upload = multer({ storage });

// Jalankan server HTTP
server.listen(process.env.PORT, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
});

app.use(router);

// Konfigurasi database PostgreSQL
export const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432,
});


export const healthCheck = async (req, res) => {

    try {
  
      const results = await pool.query('SELECT * from users');
  
      console.log('Query results:', results);
  
      res.status(200).json({ status: "healthy" });
  
    } catch (error) {
  
      console.error('Error executing query', error);
  
      res.status(500).json({ status: "unhealthy" });
  
    }
  
  };

app.get('/health', healthCheck);

// Mendapatkan userId berdasarkan token di header Authorization
app.get('/api/userId', authenticateToken, (req, res) => {
    // Token yang sudah terverifikasi di middleware authenticateToken
    const userId = req.userId;

    // Pastikan userId ada
    if (!userId) {
        return res.status(400).json({
            success: false,
            message: 'User ID not found in token',
        });
    }

    res.json({
        success: true,
        message: 'User ID retrieved successfully',
        body: { userId },
    });
});

// Register endpoint
app.post('/api/register', async (req, res) => {
    const { username, fullname, email, password } = req.body;

    try {
        // Hash password dengan bcrypt
        const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS));

        // Simpan pengguna ke database
        const result = await pool.query(
            'INSERT INTO users (username, email, full_name, password_hash, updated_at, profile_photo_path) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [username, email, fullname, passwordHash, new Date(), '/default/profile.png' ] // Sertakan nilai `updated_at`
        );
      

        // Buat JWT token
        const token = jwt.sign({ userId: result.rows[0].id, email }, process.env.JWT_SECRET, {
            expiresIn: parseInt(process.env.JWT_EXPIRY),
        });

        // Kirimkan respons dengan token
        res.status(201).json({ success: true, message: 'User registered', body: { token } });
    } catch (error) {
        if (error.code === '23505') {
            // Error karena username atau email sudah ada
            res.status(400).json({ success: false, message: 'Username or email already exists' });
        } else {
            res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
        }
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { identifier, password } = req.body;

    try {
        // Cari pengguna berdasarkan username atau email
        const result = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $1', [identifier]);

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Buat JWT token
        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: parseInt(process.env.JWT_EXPIRY),
        });
        console.log('Token:', token);
        
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Verified Token:', verified);

        // Simpan token di cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Hanya cookie HTTPS di produksi
            sameSite: 'lax', // Lindungi dari CSRF
        });

        res.status(200).json({ success: true, message: 'Login successful', body: { token } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
});

// Health Check Endpoint (Opsional)
app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Server is running' });
});



app.get('/api/users/:id?', async (req, res) => {
    let loggedInUserId = null;

    try {
        const token = req.headers.authorization?.split(' ')[1];
        // Verifikasi token dengan async/await
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                loggedInUserId = decoded.userId;
            } catch (error) {
                console.log("Bad cookie or none")
            }
        }

        const { search = '' } = req.query;

        let baseQuery = `
        SELECT 
            u.id, 
            u.username, 
            u.full_name, 
            u.profile_photo_path,
        `;

        let baseParams = [];

        if (loggedInUserId) {
            // Jika terautentikasi, filter pengguna yang sedang login
            baseQuery += `EXISTS (
                SELECT 1
                FROM connection_request 
                WHERE from_id = $1 AND to_id = u.id
            ) AS is_requested,
            EXISTS (
                SELECT 1
                FROM connection
                WHERE (from_id = $1 AND to_id = u.id) 
                    OR (from_id = u.id AND to_id = $1)
            ) AS is_connected,
            EXISTS (
                SELECT 1
                FROM connection_request 
                WHERE from_id = u.id AND to_id = $1
            ) AS is_requesting
            FROM users u
            WHERE u.id != $1`;

            // Menyaring pengguna yang sedang login
            baseParams = [loggedInUserId]; // Masukkan ID pengguna yang sedang login
        } else {
            // Jika tidak login, set nilai default untuk kolom is_requested, is_connected, is_requesting
            baseQuery += `FALSE AS is_requested,
                          FALSE AS is_connected,
                          FALSE AS is_requesting
                          FROM users u`;
        }

        if (search) {
            // Menambahkan filter pencarian
            baseQuery += ` AND (u.username ILIKE $2 OR u.full_name ILIKE $2)`;
            baseParams.push(`%${search}%`);
        } else if (req.params.id) {
            // Jika ada parameter ID, filter berdasarkan ID
            baseQuery += ` AND u.id = $2`;
            baseParams = [loggedInUserId, req.params.id];
        }

        const result = await pool.query(baseQuery, baseParams);

        res.json({
            success: true,
            message: 'Users retrieved successfully',
            body: result.rows,
        });
    } catch (error) {
        console.log("[Users]", error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
});

app.post('/api/connection-requests', authenticateToken, async (req, res) => {
    const fromId = req.userId; // ID pengguna login diambil dari token
    const { toId } = req.body;

    if (fromId === toId) {
        return res.status(400).json({
            success: false,
            message: 'You cannot send a connection request to yourself.',
        });
    }

    try {
        await pool.query(
            `INSERT INTO connection_request (from_id, to_id, created_at) 
             VALUES ($1, $2, $3)`,
            [fromId, toId, new Date()]
        );

        res.status(201).json({ success: true, message: 'Connection request sent' });
    } catch (error) {
        if (error.code === '23505') { // Constraint violation (duplicate entry)
            res.status(400).json({ success: false, message: 'Connection request already exists.' });
        } else {
            res.status(500).json({
                success: false,
                message: 'Internal Server Error',
                error: error.message,
            });
        }
    }
});


app.get('/api/connection-requests', authenticateToken, async (req, res) => {
    const toId = req.userId; // ID pengguna login, diambil dari token JWT

    try {
        const result = await pool.query(
            `SELECT cr.from_id, u.full_name, u.username, u.profile_photo_path, cr.created_at 
             FROM connection_request cr
             JOIN users u ON cr.from_id = u.id
             WHERE cr.to_id = $1
             ORDER BY cr.created_at DESC`,
            [toId]
        );

        res.json({
            success: true,
            message: 'Connection requests retrieved successfully',
            body: result.rows,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
});


app.post('/api/connection-requests/:fromId/respond', authenticateToken, async (req, res) => {
    const { fromId } = req.params;
    const { action } = req.body;
    const toId = req.userId; // ID pengguna login

    try {
        if (action === 'accept') {
            await pool.query('BEGIN');
            await pool.query(
                `INSERT INTO connection (from_id, to_id, created_at) 
                 VALUES ($1, $2, $3), ($2, $1, $3)`,
                [fromId, toId, new Date()]
            );
            await pool.query(
                `DELETE FROM connection_request 
                 WHERE from_id = $1 AND to_id = $2`,
                [fromId, toId]
            );
            await pool.query('COMMIT');
            res.json({ success: true, message: 'Connection accepted' });
        } else if (action === 'reject') {
            await pool.query(
                `DELETE FROM connection_request 
                 WHERE from_id = $1 AND to_id = $2`,
                [fromId, toId]
            );
            res.json({ success: true, message: 'Connection rejected' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid action' });
        }
    } catch (error) {
        await pool.query('ROLLBACK');
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
});

app.get('/api/connections', authenticateToken, async (req, res) => {
    const userId = req.userId; // ID pengguna login dari token

    try {
        const result = await pool.query(
            `SELECT u.id, u.username, u.full_name, u.profile_photo_path 
             FROM connection c
             JOIN users u ON c.to_id = u.id
             WHERE c.from_id = $1`,
            [userId]
        );

        res.json({
            success: true,
            message: 'Connections retrieved successfully',
            body: result.rows,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
});


app.delete('/api/connections', authenticateToken, async (req, res) => {
    const { userId1, userId2 } = req.body;
    console.log("Starting");
    try {
        await pool.query(
            `DELETE FROM connection 
             WHERE (from_id = $1 AND to_id = $2) OR (from_id = $2 AND to_id = $1)`,
            [userId1, userId2]
        );

        res.json({ success: true, message: 'Connection removed' });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
});

app.get('/api/profile/:id?', async (req, res) => {
    // console.log("Fetch boy!")
    //get who this is]
    let loggedin = false;
    jwt.verify(req.cookies.token, process.env.JWT_SECRET, (err, user) => {
        if (!err) {
            req.userId = user.userId;
            loggedin = true;
        }
        else {
            console.log(err)
        }
    });

    let id = req.params.id;
    if (id == -1) {
        id = req.userId;
    }

    const friends = loggedin ? true : false;

    if ((id == undefined)){ //if id is null
        if (loggedin) { //return own profile if id is not set
            id = req.userId
        } else {
            //error must specify id if not logged in
            return res.status(401).json({ error: 'Unauthorized access' });
        }
    } else {
        // console.log("ID is defined!",id)
    }

    let retval = {
        success: true,
        message: `Profile retrieved successfully! Viewing profile ${id} as ${req.userId}`,
        body: {
            username: "john_test",
            name: "John Test",
            work_history: `Raindrop catcher`,
            skills: "Basic III",
            connection_count: -1,
            profile_photo_path: "",
        }
    };

    try {
        const profile = await pool.query(
            `SELECT username, full_name, work_history, skills, profile_photo_path
            FROM users
            WHERE id = $1
            `,
            [id]
        );

        const connection = await pool.query(
            `SELECT COUNT(*) as jumlah
             FROM connection c
             WHERE c.from_id = $1`,
            [id]
        );

        retval["body"]["username"] = profile.rows[0]["username"]
        retval["body"]["name"] = profile.rows[0]["full_name"]
        retval["body"]["work_history"] = profile.rows[0]["work_history"]
        retval["body"]["skills"] = profile.rows[0]["skills"]
        retval["body"]["profile_photo_path"] = profile.rows[0]["profile_photo_path"]
        retval["body"]["connection_count"] = connection.rows[0]["jumlah"]
        retval["body"]["id"] = id


    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }

    if (req.userId == id) {
        retval.body.self = true
    }

    if (loggedin) {
        try {
            // Query untuk menghitung jumlah koneksi pengguna
            const result = await pool.query(
                `SELECT COUNT(*) AS connection_count
                 FROM connection
                 WHERE from_id = $1`,
                [id]
            );
            const ccount = parseInt(result.rows[0].connection_count, 10);
            retval.body.connection_count = (ccount >= 0 ? ccount : 0)
        } catch (error) {
            console.warn("Failed to fetch connection count! ",error.message)
            retval.body.connection_count = -2
        }
        try {
            // Query the database for posts from the "feed" table
            const result = await pool.query(
                `SELECT f.id, f.content, f.created_at, u.full_name, u.username, u.profile_photo_path, f.user_id
                 FROM feed f
                 JOIN users u ON f.user_id = u.id
                 WHERE f.user_id = $1
                 ORDER BY f.created_at DESC`,[id]
            );
            const fetchedPosts = result.rows.map((post) => ({
                id: Number(post.id),
                profile_photo_path: post.profile_photo_path || '/default/profile.png', // Default fallback
                full_name: post.full_name,
                username: post.username,
                updated_at: post.updated_at? post.updated_at : post.created_at ,
                user_id: post.user_id,
                content: post.content,
                is_editable: post.user_id === req.userId,
            }));
            retval.body.relevant_posts = fetchedPosts;
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    }

    res.json(retval);
});


app.post('/api/feed', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { content } = req.body;

    if (!content || !userId) {
        return res.status(400).json({ error: 'Content and user_id are required.' });
    }

    try {
        // Query untuk memasukkan data ke tabel feed
        const result = await pool.query(
          `INSERT INTO feed (content, user_id, updated_at) 
           VALUES ($1, $2, NOW()) 
           RETURNING id, content, user_id, created_at, updated_at`,
          [content, userId]
        );

        const newFeed = result.rows[0];

        // Kirimkan notifikasi push kepada semua koneksi pengguna
        await sendNewPostNotification(userId, newFeed.content);

        // Kirimkan respon dengan data yang telah dibuat
        res.status(201).json({
          message: 'Feed created successfully',
          feed: newFeed,
        });
    } catch (error) {
        console.error('Error inserting feed:', error);
        res.status(500).json({ error: 'An error occurred while creating the feed.' });
    }
});


app.get('/api/feed', authenticateToken, async (req, res) => {
    const loggedInUserId = req.userId;

    if (!loggedInUserId) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: No user logged in',
        });
    }

    try {
        // Query to get posts from connected users and the logged-in user
        const result = await pool.query(
            `SELECT f.id, f.content, f.updated_at, u.full_name, u.username, u.profile_photo_path, f.user_id
             FROM feed f
             JOIN users u ON f.user_id = u.id
             WHERE f.user_id = $1  -- Include posts from the logged-in user
                OR f.user_id IN (
                    SELECT CASE
                           WHEN c.from_id = $1 THEN c.to_id
                           ELSE c.from_id
                           END
                    FROM connection c
                    WHERE c.from_id = $1 OR c.to_id = $1
                )
             ORDER BY f.created_at DESC`,
            [loggedInUserId]
        );

        // Add is_editable parameter based on userId from the token
        const postsWithEditability = result.rows.map(post => {
            return {
                ...post,
                is_editable: post.user_id === loggedInUserId, // Add is_editable flag
            };
        });

        res.status(200).json({
            success: true,
            message: 'Posts retrieved successfully',
            body: postsWithEditability,
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
});


app.put('/api/feed', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { id, content } = req.body;

    if (!id || !content || !userId) {
        return res.status(400).json({ error: 'Content, id, and user_id are required.' });
    }

    try {
        // Cek apakah post dengan ID yang diberikan ada dan milik user yang terautentikasi
        const result = await pool.query(
            'SELECT * FROM feed WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found or you are not authorized to update this post.' });
        }

        // Jika post ditemukan dan milik user yang sesuai, lakukan update
        const updateResult = await pool.query(
            `UPDATE feed
             SET content = $1, updated_at = NOW()
             WHERE id = $2 AND user_id = $3
             RETURNING id, content, user_id, created_at, updated_at`,
            [content, id, userId]
        );

        if (updateResult.rows.length === 0) {
            return res.status(500).json({ error: 'Failed to update post.' });
        }

        res.status(200).json({
            message: 'Feed updated successfully',
            feed: updateResult.rows[0],
        });
    } catch (error) {
        console.error('Error updating feed:', error);
        res.status(500).json({ error: 'An error occurred while updating the feed.' });
    }
});

app.delete('/api/feed', authenticateToken, async (req, res) => {
    const userId = req.userId;
    const { id } = req.body;

    if (!id || !userId) {
        return res.status(400).json({ error: 'id and user_id are required.' });
    }

    try {
        // Cek apakah post dengan ID yang diberikan ada dan milik user yang terautentikasi
        const result = await pool.query(
            'SELECT * FROM feed WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found or you are not authorized to delete this post.' });
        }

        // Jika post ditemukan dan milik user yang sesuai, lakukan delete
        const deleteResult = await pool.query(
            'DELETE FROM feed WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        if (deleteResult.rows.length === 0) {
            return res.status(500).json({ error: 'Failed to delete post.' });
        }

        res.status(200).json({
            message: 'Feed deleted successfully',
            id: deleteResult.rows[0].id,
        });
    } catch (error) {
        console.error('Error deleting feed:', error);
        res.status(500).json({ error: 'An error occurred while deleting the feed.' });
    }
});

export function authenticateToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.warn(err);
            return res.sendStatus(403)};
        req.userId = user.userId;
        next();
    });
}

app.get('/api/connection-recommendation/:id?', authenticateToken, async (req, res) => {
    const loggedInUserId = req.userId; // ID pengguna yang sedang login dari middleware

    try {
        // Query untuk mendapatkan koneksi hingga depth 2
        let query = `

        -- Depth 2: Koneksi dari pengguna yang terhubung dengan depth 1
        SELECT u.id, u.username, u.full_name, u.profile_photo_path,
               2 AS depth_connection,  -- Depth 2
               EXISTS (
                   SELECT 1
                   FROM connection_request 
                   WHERE from_id = $1 AND to_id = u.id
               ) AS is_requested,
               EXISTS (
                   SELECT 1
                   FROM connection
                   WHERE (from_id = $1 AND to_id = u.id) 
                       OR (from_id = u.id AND to_id = $1)
               ) AS is_connected,
               EXISTS (
                   SELECT 1
                   FROM connection_request 
                   WHERE from_id = u.id AND to_id = $1
               ) AS is_requesting
        FROM users u
        WHERE u.id IN (
            SELECT to_id 
            FROM connection c
            WHERE c.from_id IN (
                SELECT to_id 
                FROM connection
                WHERE from_id = $1
                UNION
                SELECT from_id 
                FROM connection
                WHERE to_id = $1
            )
            UNION
            SELECT from_id 
            FROM connection c
            WHERE c.to_id IN (
                SELECT to_id 
                FROM connection
                WHERE from_id = $1
                UNION
                SELECT from_id 
                FROM connection
                WHERE to_id = $1
            )
        )
        AND u.id != $1;  -- Menghindari pengguna yang sedang login

        `;

        const result = await pool.query(query, [loggedInUserId]);

        res.json({
            success: true,
            message: 'Connection recommendations retrieved successfully',
            body: result.rows,
        });
    } catch (error) {
        console.error("[Connection Recommendation]", error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
});


app.get('/api/connections/count', authenticateToken, async (req, res) => {
    const userId = req.query.userId || req.userId; // Jika userId diberikan di query, gunakan itu; jika tidak, gunakan user login.

    try {
        // Query untuk menghitung jumlah koneksi pengguna
        const result = await pool.query(
            `SELECT COUNT(*) AS connection_count
             FROM connection
             WHERE from_id = $1`,
            [userId]
        );

        res.json({
            success: true,
            message: 'Connection count retrieved successfully',
            body: { connection_count: parseInt(result.rows[0].connection_count, 10) },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
});

app.put("/api/profile/:id", authenticateToken, upload.single("photo"), async (req, res) => {
    const { username, name, work_history, skill } = req.body;
    const file = req.file;
    const userid = req.params.id;

    if (!userid) {
        console.warn("[PUT PROFILE] User is not logged in");
        return res.status(400).json({ error: "Must be logged in!" });
    }

    if (userid != req.userId) {
        console.warn("[PUT PROFILE] User tried to edit other profile");
        return res.status(400).json({ error: "Go edit your own profile jackass" });
    }

    if (!username) {
        console.warn("[PUT PROFILE] No username?");
        return res.status(400).json({ error: "Username is required" });
    }

    const profile_photo_path = file ? `/pfp/${file.filename}` : null;

    const query = `
    UPDATE "users"
    SET 
        username = $1, 
        full_name = $2, 
        work_history = $3, 
        skills = $4, 
        profile_photo_path = COALESCE($5, profile_photo_path), 
        updated_at = NOW()
    WHERE id = $6
    RETURNING *;
    `;

    const values = [
        username,
        name,
        work_history,
        skill,
        profile_photo_path, // This can be null if no file is uploaded
        req.userId
    ];

    try {
        const result = await pool.query(query, values);
        const updatedProfile = result.rows[0]; // The updated user row

        res.status(200).json({
            message: "Profile updated successfully!",
            profile: updatedProfile
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: "Error updating profile." });
    }
});