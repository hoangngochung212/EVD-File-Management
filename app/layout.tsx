import type { Metadata } from 'next';
import Providers from './providers';
import './globals.css';
import { AntdRegistry } from '@ant-design/nextjs-registry';

export const metadata: Metadata = {
  title: 'EVD - Document Management',
  description: 'Admin screen for the EVD (File Management) module',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers><AntdRegistry>{children}</AntdRegistry></Providers>
      </body>
    </html>
  );
}
