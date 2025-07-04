- Deskripsi aplikasi web
- Penjelasan mengenai pembagian tugas masing-masing anggota (lihat formatnya pada bagian pembagian tugas).

## Cara Instalasi

1. **Clone repo melalui**

2. **Jalankan build docker**
    ```
    docker-compose build
    ```

3. **Tunggu selesai...**

## Cara Menjalankan

1. **Jalankan compose up**
    ```
    docker-compose up
    ```

2. **Akses front-end melalui**
    ```
    http://localhost:5173/
    ```

## API Documentation

- **Dapat diakses melalui**
    ```
    http://localhost:3000/api-docs/
    ```
## Features
- **Landing Page**

<div align="center">
  <img src="docs/landing-page.png" alt="Landing Page" width="400" />
</div>

- **Feed (Logged-In)**

<div align="center">
  <img src="docs/feed.png" alt="Feed" width="400" />
</div>

- **Users (Logged-In | Guest)**

<div align="center">
  <img src="docs/users-loggedin.png" alt="Logged in as user" width="400" />
</div>

<div align="center">
  <img src="docs/users-guest.png" alt="Viewing as guest" width="400" />
</div>

- **Profile (Logged-In Self | Logged-In other | Guest)**

<div align="center">
  <img src="docs/profile-self.png" alt="Viewing as self" width="400" />
</div>
<div align="center">
  <img src="docs/profile-other.png" alt="Viewing as other user" width="400" />
</div>
<div align="center">
  <img src="docs/profile-guest.png" alt="Viewing as guest" width="400" />
</div>


- **Connection Requests (Logged-In)**

<div align="center">
  <img src="docs/connection-requests.png" alt="Connection requests" width="400" />
</div>

- **Connections (Logged-In)**

<div align="center">
  <img src="docs/connections.png" alt="Current connections" width="400" />
</div>

- **Chat (Logged-In)**

<div align="center">
  <img src="docs/chat.png" alt="Not gpt lmao" width="400" />
</div>

## Load Test

<div align="center">
  <img src="docs/loadtestprofile.jpg" alt="Not gpt lmao" width="400" />
</div>


## Bonuses
- **UI/UX Mirip LinkedIn**
- **Connection Recomendation**
- **Typing Indicator**

## Pembagian Tugas

| Feature        |      Front end |         Back end |
|----------------|----------------|------------------|
| **Basics** |
| Auth and authorization| 13522124 | 13522124, 13522146 |
| Profile | 13522130 | 13522130 |
| Connections | 13522146 | 13522146 |
| Feed | 13522124 | 13522124 |
| Chat and Websockets | 13522130, 13522146| 13522130, 13522146 |
| Notifications | 13522146 | 13522146 |
| Stress and load test | | 13522146 |
|  **Bonus**  |
| UI/UX LinkedIn |  |  |
| Connection Recomendation | 13522124 | 13522124 |
| Typing Indicator | 13522146 | 13522146 |
