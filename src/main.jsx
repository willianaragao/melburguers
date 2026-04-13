import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminDashboard from './AdminDashboard.jsx'

const Root = () => {
  const isAdmin = new URLSearchParams(window.location.search).get('admin') === 'true';
  return isAdmin ? <AdminDashboard /> : <App />;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
