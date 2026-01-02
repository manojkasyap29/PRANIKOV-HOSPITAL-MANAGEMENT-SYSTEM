import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CartProvider } from '@/contexts/CartContext';

createRoot(document.getElementById("root")!).render(
	<ThemeProvider>
		<CartProvider>
			<App />
		</CartProvider>
	</ThemeProvider>
);
