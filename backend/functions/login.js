// =============================================================
// SIMANDAKES - Nhost Serverless Function: Login
// Endpoint: POST /api/login
//
// Body: { "username": "admin", "password": "admin123" }
// Response 200: { "success": true, "token": "<jwt>", "user": {...} }
// Response 401: { "success": false, "error": "Invalid credentials" }
//
// Catatan:
//   - Function ini berjalan di Nhost Runtime (Deno-like environment)
//   - Pakai bcryptjs untuk verifikasi password (sudah pre-installed di Nhost)
//   - JWT diterbitkan oleh Nhost Auth (kita pakai hasura-claims)
// =============================================================

import bcrypt from 'bcryptjs';

export default async (req, res) => {
  // Hanya izinkan POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username dan password wajib diisi',
    });
  }

  try {
    // Query user dari database via Hasura GraphQL (admin secret)
    const hasuraRes = await fetch(
      `${process.env.NHOST_BACKEND_URL}/v1/graphql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': process.env.NHOST_ADMIN_SECRET,
        },
        body: JSON.stringify({
          query: `
            query GetUserByUsername($username: String!) {
              users(where: {
                username: { _eq: $username },
                deleted_at: { _is_null: true },
                status: { _eq: "aktif" }
              }) {
                id
                username
                password_hash
                nama_lengkap
                role
                email
                status
              }
            }
          `,
          variables: { username },
        }),
      }
    );

    const { data, errors } = await hasuraRes.json();

    if (errors || !data || data.users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Username tidak ditemukan atau akun nonaktif',
      });
    }

    const user = data.users[0];

    // Verifikasi password
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Password salah',
      });
    }

    // Update last_login_at
    await fetch(`${process.env.NHOST_BACKEND_URL}/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.NHOST_ADMIN_SECRET,
      },
      body: JSON.stringify({
        query: `
          mutation UpdateLastLogin($userId: uuid!) {
            update_users_by_pk(
              pk_columns: { id: $userId },
              _set: { last_login_at: now() }
            ) { id }
          }
        `,
        variables: { userId: user.id },
      }),
    });

    // Terbitkan JWT via Nhost Auth
    // Pakai endpoint sign-in Nhost untuk dapatkan JWT
    const nhostAuthRes = await fetch(
      `${process.env.NHOST_AUTH_URL}/v1/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          refreshToken: { expiresIn: 3600 * 24 * 7 }, // 7 hari
        }),
      }
    );

    const authData = await nhostAuthRes.json();

    return res.status(200).json({
      success: true,
      token: authData.accessToken,
      refreshToken: authData.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan server. Silakan coba lagi.',
    });
  }
};
