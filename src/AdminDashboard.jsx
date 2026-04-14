import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, Printer, Bell, CheckCircle, Clock, 
  RefreshCcw, ChevronRight, LayoutDashboard, Settings, Edit, Plus, Trash2, Save, X, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { printOrder, formatOrderForPrinter } from './utils/printer';
import { getMenuData, saveMenuData } from './utils/menuStore';

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' ou 'menu'
  
  const [orders, setOrders] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isAutoPrint, setIsAutoPrint] = useState(false);
  const lastOrderId = useRef(null);
  
  // Menu State
  const [appMenuData, setAppMenuData] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const notificationAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

  useEffect(() => {
    // Only fetch menu data on client after auth
    setAppMenuData(getMenuData());
  }, []);

  const fetchOrders = async () => {
    if (!isAuthenticated) return;
    try {
      if (orders.length === 0) {
        setOrders([
          {
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
          }
        ]);
      }
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 10000); 
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (orders.length > 0 && isAuthenticated) {
      const latestOrder = orders[0];
      if (latestOrder.id !== lastOrderId.current) {
        lastOrderId.current = latestOrder.id;
        notificationAudio.play().catch(e => console.log("Áudio bloqueado pelo navegador"));
        
        if (isAutoPrint) {
          handlePrint(latestOrder);
        }
      }
    }
  }, [orders, isAutoPrint, isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'Gatinha08') {
      setIsAuthenticated(true);
    } else {
      alert("Senha incorreta!");
    }
  };

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

  // Funções de Gestão de Cardápio
  const handleSaveMenu = (newMenu) => {
    setAppMenuData(newMenu);
    saveMenuData(newMenu);
  };

  const handleEditItem = (category, item) => {
    setEditingCategory(category);
    setEditingItem({...item}); // Clone for editing
  };

  const handleDeleteItem = (category, itemId) => {
    if(window.confirm("Certeza que deseja deletar este item?")) {
      const newMenu = {...appMenuData};
      newMenu.menu[category] = newMenu.menu[category].filter(i => i.id !== itemId);
      handleSaveMenu(newMenu);
    }
  };

  const handleSaveEdit = () => {
    if (!editingItem.name || !editingItem.price) {
      alert("Nome e preço são obrigatórios!");
      return;
    }
    
    const newMenu = {...appMenuData};
    
    // Convert price to number
    editingItem.price = parseFloat(editingItem.price);
    if(editingItem.original_price) {
        editingItem.original_price = parseFloat(editingItem.original_price);
    }

    if (!editingItem.id) {
      // New Item
      editingItem.id = Date.now().toString();
      newMenu.menu[editingCategory].push(editingItem);
    } else {
      // Update Item
      const index = newMenu.menu[editingCategory].findIndex(i => i.id === editingItem.id);
      newMenu.menu[editingCategory][index] = editingItem;
    }
    
    handleSaveMenu(newMenu);
    setEditingItem(null);
    setEditingCategory(null);
  };


  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDF5E6', padding: '20px' }}>
        <form onSubmit={handleLogin} style={{ background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(236,148,36,0.15)', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <img src="/images/logo.png" alt="Mel Burgers" style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '20px', border: '3px solid #EC9424' }} />
          <h2 style={{ color: '#2D1B14', marginBottom: '20px', fontSize: '24px' }}>Acesso Restrito</h2>
          <input 
            type="password" 
            placeholder="Senha de Acesso"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #ddd', marginBottom: '20px', fontSize: '16px' }}
          />
          <button type="submit" style={{ width: '100%', padding: '15px', background: '#EC9424', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            Entrar no Painel
          </button>
          <p style={{ marginTop: '15px', fontSize: '12px', color: '#888' }}>Senha padrão: Gatinha08</p>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-container" style={{ background: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px', color: '#2D1B14' }}>
            <LayoutDashboard color="#EC9424" /> Painel de Controle
          </h1>
          <p style={{ opacity: 0.6 }}>Gestão da Lanchonete</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setActiveTab('orders')}
            style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: activeTab === 'orders' ? '#2D1B14' : 'white', color: activeTab === 'orders' ? 'white' : '#2D1B14', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Pedidos em Tempo Real
          </button>
          <button 
            onClick={() => setActiveTab('menu')}
            style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: activeTab === 'menu' ? '#2D1B14' : 'white', color: activeTab === 'menu' ? 'white' : '#2D1B14', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Gestão do Cardápio
          </button>
        </div>
      </header>

      {activeTab === 'orders' && (
        <>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
            <button 
              onClick={() => setIsAutoPrint(!isAutoPrint)}
              className={`action-btn ${isAutoPrint ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Printer size={18} />
              {isAutoPrint ? 'Auto-Imprimir LIGADO' : 'Auto-Imprimir DESLIGADO'}
            </button>
          </div>

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
                      ENDEREÇO:
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
                      style={{ flex: 1, padding: '10px', fontSize: '14px', background: '#EC9424', color: 'white', border: 'none', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                      onClick={() => handlePrint(order)}
                      disabled={isPrinting}
                    >
                      {isPrinting ? '...' : <><Printer size={16} /> Imprimir</>}
                    </button>
                    {order.status === 'pendente' && (
                      <button 
                        className="checkout-btn" 
                        style={{ flex: 1, padding: '10px', fontSize: '14px', background: '#28A745', color: 'white', border: 'none', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
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
        </>
      )}

      {activeTab === 'menu' && appMenuData && (
        <div style={{ background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          {editingItem ? (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Edit color="#EC9424" /> {editingItem.id ? 'Editar Produto' : 'Novo Produto'}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Nome do Produto</label>
                  <input type="text" value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px' }} />
                </div>
                
                <div>
                  <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Descrição (Ingredientes)</label>
                  <textarea value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px', height: '80px' }} />
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Preço Atual (R$)</label>
                    <input type="number" step="0.01" value={editingItem.price || ''} onChange={e => setEditingItem({...editingItem, price: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#888' }}>Preço Riscado (Opcional)</label>
                    <input type="number" step="0.01" value={editingItem.original_price || ''} onChange={e => setEditingItem({...editingItem, original_price: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '14px', fontWeight: 'bold' }}>URL da Imagem</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                    <input type="text" value={editingItem.image || ''} placeholder="https://..." onChange={e => setEditingItem({...editingItem, image: e.target.value})} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
                  </div>
                  {editingItem.image && (
                    <img src={editingItem.image} alt="Preview" style={{ marginTop: '10px', width: '100px', height: '100px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #EC9424' }} />
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={handleSaveEdit} style={{ flex: 1, padding: '15px', background: '#EC9424', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <Save size={18} /> Salvar Produto
                  </button>
                  <button onClick={() => setEditingItem(null)} style={{ flex: 1, padding: '15px', background: '#f5f5f5', color: '#333', border: '1px solid #ddd', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <X size={18} /> Cancelar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {Object.keys(appMenuData.menu).map(category => (
                <div key={category} style={{ marginBottom: '40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '20px', color: '#2D1B14', margin: 0 }}>{category}</h3>
                    <button 
                      onClick={() => { setEditingCategory(category); setEditingItem({ name: '', price: '', description: '', image: '' }) }}
                      style={{ background: '#FFF9F0', color: '#EC9424', border: '1px dashed #EC9424', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Plus size={16} /> Adicionar Item
                    </button>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                    {appMenuData.menu[category].map(item => (
                      <div key={item.id} style={{ display: 'flex', border: '1px solid #eee', borderRadius: '12px', padding: '10px', alignItems: 'center', gap: '15px' }}>
                        <img src={item.image} alt={item.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 4px', fontSize: '15px' }}>{item.name}</h4>
                          <span style={{ color: '#28A745', fontWeight: 'bold', fontSize: '14px' }}>R$ {parseFloat(item.price).toFixed(2).replace('.',',')}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleEditItem(category, item)} style={{ background: '#f5f5f5', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                            <Edit size={16} color="#EC9424" />
                          </button>
                          <button onClick={() => handleDeleteItem(category, item.id)} style={{ background: '#fff0f0', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                            <Trash2 size={16} color="#ff4444" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
