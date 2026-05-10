import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useAuth } from '@/context/AuthContext';
import { getCurrentUser } from '@/lib/auth';
import RoleGate from '@/components/RoleGate';
import { ROLES } from '@/config/roles';
import { useRouter } from 'next/router';

type Usuario = {
  id: string;
  username: string;
  role: string;
  estado: boolean;
  createdAt: string;
};

export default function UsuariosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{ username: string; password: string; role: string }>({
    username: '',
    password: '',
    role: ROLES.USUARIO,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users', {
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Error fetching users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (!user || user.role !== ROLES.ADMINISTRACION) {
    router.push('/dashboard');
    return null;
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Error creating user');
      setFormData({ username: '', password: '', role: ROLES.USUARIO });
      setShowForm(false);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Eliminar usuario?')) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Error deleting user');
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  return (
    <RoleGate allowedRoles={[ROLES.ADMINISTRACION]}>
      <div style={{ padding: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h1>Gestión de Usuarios</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {showForm ? 'Cancelar' : '+ Nuevo Usuario'}
          </button>
        </div>

        {error && <div style={{ color: '#dc3545', marginBottom: '10px' }}>{error}</div>}

        {showForm && (
          <form
            onSubmit={handleCreateUser}
            style={{
              marginBottom: '20px',
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <div style={{ marginBottom: '10px' }}>
              <label>Usuario:</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                style={{ width: '100%', padding: '5px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Contraseña:</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                style={{ width: '100%', padding: '5px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Rol:</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={{ width: '100%', padding: '5px' }}
              >
                <option value={ROLES.USUARIO}>Usuario</option>
                <option value={ROLES.ADMINISTRACION}>Administrador</option>
              </select>
            </div>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Crear Usuario
            </button>
          </form>
        )}

        {loading ? (
          <p>Cargando usuarios...</p>
        ) : users.length === 0 ? (
          <p>No hay usuarios registrados</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '10px' }}>Usuario</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Rol</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Estado</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Creado</th>
                <th style={{ textAlign: 'center', padding: '10px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{u.username}</td>
                  <td style={{ padding: '10px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        backgroundColor: u.role === ROLES.ADMINISTRACION ? '#dc3545' : '#007bff',
                        color: 'white',
                        borderRadius: '3px',
                        fontSize: '12px',
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    {u.estado ? 'Activo' : 'Inactivo'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </RoleGate>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await getCurrentUser(context.req as any);

  if (!user || user.role !== 'admin') {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

