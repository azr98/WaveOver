import ClerkProviderWithKey from "../components/ClerkProviderWithKey";

// Import global CSS if you have it (e.g., Tailwind or your own)
import './globals.css';

export const metadata = {
  title: 'WaveOver',
  description: 'Talk It Out — Without Talking Over Each Other',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClerkProviderWithKey>
          {children}
        </ClerkProviderWithKey>
      </body>
    </html>
  );
} 