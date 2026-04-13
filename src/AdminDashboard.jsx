import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, Printer, Bell, CheckCircle, Clock, 
  RefreshCcw, ChevronRight, LayoutDashboard, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { printOrder, formatOrderForPrinter } from './utils/printer';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isAutoPrint, setIsAutoPrint] = useState(false);
  const lastOrderId = useRef(null);
  
  // Áudio para notificação (Usando um som padrão de sistema)
  const notificationAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

  // MOCK: Simula busca de pedidos no backend
  const fetchOrders = async () => {
    try {
      // Aqui você substituiria pela sua URL do n8n que lista os pedidos
      // const response = await fetch('https://SUA-URL-N8N.com/get-orders');
      // const data = await response.json();
      
      // Simulação para teste inicial
      if (orders.length === 0) {
        const mockOrder = {
          id: '1234',
          timestamp: new Date().toISOString(),
          subtotal: 39.99,
          deliveryFee: 10.00,
          total: 49.99,
          items: [
            { name: 'Big Boss', price: 22.00 },
            { name: 'Batata Malucona', price: 27.99 }
          ],
          address: {
            street: 'Rua das Flores',
            number: '123',
            neighborhood: 'Tamoios',
            complement: 'Casa amarela'
          },
          status: 'pendente'
        };
        setOrders([mockOrder]);
      }
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Checa a cada 10 seg
    return () => clearInterval(interval);
  }, []);

  // Monitora novos pedidos para tocar o som
  useEffect(() => {
    if (orders.length > 0) {
      const latestOrder = orders[0];
      if (latestOrder.id !== lastOrderId.current) {
        lastOrderId.current = latestOrder.id;
        notificationAudio.play().catch(e => console.log("Áudio bloqueado pelo navegador"));
        
        if (isAutoPrint) {
          handlePrint(latestOrder);
        }
      }
    }
  }, [orders]);

  const handlePrint = async (order) => {
    setIsPrinting(true);
    const printerData = formatOrderForPrinter(order.items, order.total, order.address);
    try {
      await printOrder(printerData);
    } catch (err) {
      alert("Erro ao imprimir. Verifique se a impressora está ligada e pareada.");
    } finally {
      setIsPrinting(false);
    }
  };

  const updateStatus = (id, newStatus) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  return (
    <div className="admin-container" style={{ background: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px' }}>
            <LayoutDashboard color="#EC9424" /> Painel de Pedidos
          </h1>
          <p style={{ opacity: 0.6 }}>Mel Burgers • Gestão em Tempo Real</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={() => setIsAutoPrint(!isAutoPrint)}
            className={`action-btn ${isAutoPrint ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {isAutoPrint ? 'Auto-Imprimir ON' : 'Auto-Imprimir OFF'}
          </button>
          <button className="action-btn btn-secondary btn-icon">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="orders-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        <AnimatePresence>
          {orders.map(order => (
            <motion.div 
              key={order.id}
              className="order-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                borderLeft: `6px solid ${order.status === 'pendente' ? '#EC9424' : '#28A745'}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ fontWeight: 700, fontSize: '18px' }}>#{order.id}</span>
                <span className="cart-item-price">R$ {order.total.toFixed(2).replace('.', ',')}</span>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: '#888' }}>ITENS:</div>
                {order.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '2px' }}>
                    <span>{item.name}</span>
                    <span style={{ opacity: 0.6 }}>R${item.price.toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '15px', borderTop: '1px dashed #eee', paddingTop: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>Subtotal:</span>
                  <span>R$ {(order.subtotal || 0).toFixed(2).replace('.', ',')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#EC9424' }}>
                  <span>Frete:</span>
                  <span>+ R$ {(order.deliveryFee || 0).toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              <div style={{ marginBottom: '20px', padding: '12px', background: '#f9f9f9', borderRadius: '12px' }}>
                <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '4px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
                   <Truck size={14} /> ENDEREÇO:
                </div>
                {order.address ? (
                  <div style={{ fontSize: '13px' }}>
                    {order.address.street}, {order.address.number}<br/>
                    {order.address.neighborhood}
                    {order.address.complement && <div style={{ opacity: 0.6, fontSize: '12px' }}>Ref: {order.address.complement}</div>}
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: '#f00' }}>Endereço não informado</div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="checkout-btn" 
                  style={{ flex: 1, padding: '10px', fontSize: '14px', background: '#EC9424' }}
                  onClick={() => handlePrint(order)}
                  disabled={isPrinting}
                >
                  {isPrinting ? '...' : <><Printer size={16} /> Imprimir</>}
                </button>
                {order.status === 'pendente' && (
                  <button 
                    className="checkout-btn" 
                    style={{ flex: 1, padding: '10px', fontSize: '14px', background: '#28A745' }}
                    onClick={() => updateStatus(order.id, 'concluido')}
                  >
                    <CheckCircle size={16} /> Prontinho
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {orders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '100px', opacity: 0.3 }}>
          <Clock size={64} style={{ margin: '0 auto 20px' }} />
          <p>Aguardando novos pedidos...</p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
