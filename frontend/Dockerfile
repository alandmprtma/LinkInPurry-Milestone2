# Gunakan image Node.js resmi
FROM node:18-alpine

# Atur direktori kerja di dalam container
WORKDIR /app

# Salin file package.json dan package-lock.json (jika ada) ke container
COPY package*.json ./

# Install dependencies
RUN npm install

# Salin seluruh kode aplikasi ke container
COPY . .

# Ekspos port yang digunakan oleh Vite (default 5173)
EXPOSE 5173

# Jalankan Vite server (development mode)
CMD ["npm", "run", "dev","--","--host"]
