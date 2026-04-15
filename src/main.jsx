import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminDashboard from './AdminDashboard.jsx'

const Root = () => {
  const isAdmin = window.location.pathname === '/admin' || new URLSearchParams(window.location.search).has('admin');
  return isAdmin ? <AdminDashboard /> : <App />;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
