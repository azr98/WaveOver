import ClerkProviderWithKey from "../components/ClerkProviderWithKey";
import 'bootstrap/dist/css/bootstrap.min.css';
import './custom.css';

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