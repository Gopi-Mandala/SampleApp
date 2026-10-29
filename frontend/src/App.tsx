import { BrowserRouter } from 'react-router-dom';
import { Header } from './components';
import AppRoutes from './routes';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
