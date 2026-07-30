import AppRoutes from "./routes/AppRoutes";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";


function App() {
  return  (
         
        <AppRoutes />   
  );
}

export default App;