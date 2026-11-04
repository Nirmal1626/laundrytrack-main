import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LaundryTrack — by Nirmal Kumar',
  description: 'Laundry counter operations by Nirmal Kumar.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
