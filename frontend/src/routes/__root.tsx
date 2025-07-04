import * as React from 'react';
import { Outlet, createRootRoute } from '@tanstack/react-router';
import { useNavigate, useLocation } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const navigate = useNavigate();
  const location = useLocation(); // Hook untuk mendapatkan informasi route saat ini

  // Fungsi untuk mendapatkan token dari cookie
  const getToken = () => {
    const cookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='));
    return cookie ? cookie.split('=')[1] : null;
  };

  // Fungsi untuk memeriksa apakah token valid
  const checkAuth = () => {
    const token = getToken();
    // Cek jika token ada dan jika user sedang mengakses halaman login atau register
    if (!token && !['/login', '/register', '/', '/users', '/profile'].includes(location.pathname)) {
      // Jika tidak ada token dan halaman bukan login/register, arahkan ke login
      navigate({ to: '/login' });
    }
  };

  // Menjalankan pengecekan token saat komponen pertama kali dimuat
  React.useEffect(() => {
    checkAuth();
  }); // Menambahkan dependensi untuk mengecek perubahan lokasi

  return (
    <React.Fragment>
      {/* Jika token valid atau halaman login/register, lanjutkan merender Outlet */}
      <Outlet />
    </React.Fragment>
  );
}
