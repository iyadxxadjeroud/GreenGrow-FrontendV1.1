// pages/_app.js
import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext'; // Assuming you have an AuthProvider
import { GreenhouseProvider } from '../context/GreenhouseContext'; // NEW: Import GreenhouseProvider

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <GreenhouseProvider> {/* NEW: Wrap with GreenhouseProvider */}
        <Component {...pageProps} />
      </GreenhouseProvider>
    </AuthProvider>
  );
}

export default MyApp;