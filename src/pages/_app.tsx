import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import Head from 'next/head';
import { APP_NAME } from '@/config/app';

import '@/styles/globals.css';
import AdminGate from '@/components/AdminGate';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
          <title>{APP_NAME}</title>
          <link rel="icon" href="/favicon.ico" />
          <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
     </Head>
     <AdminGate>
          <Layout>
             <Component {...pageProps} />
          </Layout>
        </AdminGate>
    </AuthProvider>
  );
}
