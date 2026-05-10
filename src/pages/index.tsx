import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from '@/context/AuthContext';
import Image from "next/image";
import { FiLock, FiUser } from "react-icons/fi";
import styles from '@/styles/login.module.css';
import packageInfo from "../../package.json";
import { APP_NAME } from "@/config/app";


const APP_VERSION = `v${packageInfo.version}`;

export default function Login() {
  const { login } = useAuth();

  const [username,    setUsername]    = useState('');
  const [password,    setPassword]    = useState('');
  const [error,       setError]       = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    try {
      // AuthContext maneja la redirección automáticamente según el rol
      await login(username, password);
    } catch (err) {
      setError('Usuario o contraseña incorrectos.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>

        <div className={styles.brandArea}>
          <div className={styles.logoBadge}>
            <Image
              src="/logo_app.svg"
              alt={`Logo ${APP_NAME}`}
              width={72}
              height={72}
              priority
            />
          </div>
          <h1 className={styles.title}>{APP_NAME}</h1>
          <p className={styles.subtitle}>Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>

          <label htmlFor="username" className={styles.srOnly}>
            Usuario
          </label>
          <div className={styles.inputGroup}>
            <FiUser className={styles.inputIcon} aria-hidden="true" />
            <input
              id="username"
              type="text"
              placeholder="Usuario"
              className={styles.inputField}
              value={username}
              onChange={(e) => setUsername(e.target.value.trim().toLowerCase())}
              required
              autoComplete="username"
              disabled={isLoggingIn}
            />
          </div>

          <label htmlFor="password" className={styles.srOnly}>
            Contraseña
          </label>
          <div className={styles.inputGroup}>
            <FiLock className={styles.inputIcon} aria-hidden="true" />
            <input
              id="password"
              type="password"
              placeholder="Contraseña"
              className={styles.inputField}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={isLoggingIn}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={isLoggingIn}
            className={styles.loginButton}
          >
            {isLoggingIn ? "Ingresando..." : "Ingresar"}
          </button>

        </form>

        <div className={styles.footer}>
          {APP_NAME} {APP_VERSION}
        </div>
      </div>
    </div>
  );
}