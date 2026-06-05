import './styles.css';

export const metadata = {
  title: '10k Coach',
  description: 'Adaptive 10k training app'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
