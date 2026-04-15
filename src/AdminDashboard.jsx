import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, Printer, Bell, CheckCircle, Clock, 
  RefreshCcw, ChevronRight, LayoutDashboard, Settings, Edit, Plus, Trash2, Save, X, Image as ImageIcon,
  DollarSign, ArrowUpCircle, ArrowDownCircle, TrendingUp, LogOut, Menu, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { printOrder, formatOrderForPrinter } from './utils/printer';
import { getMenuData, saveMenuData } from './utils/menuStore';
import { supabase } from './utils/supabase';

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'menu', 'finance'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [orders, setOrders] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isAutoPrint, setIsAutoPrint] = useState(false);
  const lastOrderId = useRef(null);
  
  // Finance State
  const [financeTransactions, setFinanceTransactions] = useState([]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', type: 'exit' });
  
  // Menu State
  const [appMenuData, setAppMenuData] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const notificationAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

  useEffect(() => {
    // Check Persistence
    const savedAuth = localStorage.getItem('melburguers_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    // Only fetch menu data on client after auth
    setAppMenuData(getMenuData());
  }, []);

  const fetchOrders = async () => {
    if (!isAuthenticated) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Mapear campos para compatibilidade se necessário
      const formattedOrders = data.map(o => ({
        ...o,
        id: o.order_id || o.id // Prioriza order_id do app
      }));
      
      setOrders(formattedOrders);
    } catch (err) {
      console.error("Erro ao buscar pedidos do Supabase:", err);
    }
  };

  // Menu Sync com Supabase
  const syncMenuFromCloud = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_config')
        .select('data')
        .eq('id', 1)
        .single();
      
      if (data) {
        setAppMenuData(data.data);
        saveMenuData(data.data); // Back do localstorage
      } else if (error && error.code === 'PGRST116') {
        // Tabela vazia, vamos subir o padrão
        const currentMenu = getMenuData();
        await supabase.from('menu_config').insert([{ id: 1, data: currentMenu }]);
        setAppMenuData(currentMenu);
      }
    } catch (err) {
      console.error("Erro sync menu:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      syncMenuFromCloud();
      fetchFinanceData();

      // Realtime do Supabase
      const channel = supabase
        .channel('orders_realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            const newOrder = { ...payload.new, id: payload.new.order_id || payload.new.id };
            setOrders(current => [newOrder, ...current]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated]);

  const fetchFinanceData = async () => {
    try {
      const { data, error } = await supabase
        .from('finance')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setFinanceTransactions(data);
    } catch (err) {
      console.error("Erro financeiro:", err);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount) return;
    try {
      const { data, error } = await supabase
        .from('finance')
        .insert([{ 
          description: newExpense.description, 
          amount: parseFloat(newExpense.amount), 
          type: 'exit' 
        }])
        .select();
      
      if (data) {
        setFinanceTransactions([data[0], ...financeTransactions]);
        setIsAddingExpense(false);
        setNewExpense({ description: '', amount: '', type: 'exit' });
      }
    } catch (err) {
      alert("Erro ao salvar despesa");
    }
  };

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
      localStorage.setItem('melburguers_admin_auth', 'true');
    } else {
      alert("Senha incorreta!");
    }
  };

  const handleLogout = () => {
    if(window.confirm("Deseja realmente sair?")) {
      setIsAuthenticated(false);
      localStorage.removeItem('melburguers_admin_auth');
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

  const updateStatus = async (id, newStatus) => {
    try {
      // No Supabase, o ID primário pode ser diferente do order_id
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .or(`order_id.eq.${id},id.eq.${id}`); // Tenta os dois
      
      if (error) throw error;
      setOrders(orders.map(o => (o.order_id === id || o.id === id) ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  };

  // Funções de Gestão de Cardápio
  const handleSaveMenu = async (newMenu) => {
    setAppMenuData(newMenu);
    saveMenuData(newMenu);
    
    // Sync para nuvem
    try {
      await supabase.from('menu_config').update({ data: newMenu }).eq('id', 1);
    } catch (err) {
      console.log("Erro ao salvar menu na nuvem:", err);
    }
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

  const totalRevenue = orders.reduce((acc, order) => acc + (order.total || 0), 0);
  const totalExpenses = financeTransactions.reduce((acc, trans) => acc + (trans.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar Retrátil */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? '260px' : '80px' }}
        style={{
          background: '#2D1B14',
          color: 'white',
          padding: '20px 15px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 15px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 100
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'space-between' : 'center', marginBottom: '40px' }}>
          {isSidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/images/logo.png" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #EC9424' }} />
              <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '1px' }}>MEL ADMIN</span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'orders', icon: LayoutDashboard, label: 'Painel de Controle' },
            { id: 'menu', icon: ShoppingBag, label: 'Gestão Cardápio' },
            { id: 'finance', icon: DollarSign, label: 'Financeiro' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '12px 15px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === item.id ? '#EC9424' : 'transparent',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
                justifyContent: isSidebarOpen ? 'flex-start' : 'center'
              }}
            >
              <item.icon size={22} />
              {isSidebarOpen && <span style={{ fontWeight: 600 }}>{item.label}</span>}
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            padding: '12px 15px',
            borderRadius: '12px',
            border: 'none',
            background: 'rgba(255,50,50,0.1)',
            color: '#ff4444',
            cursor: 'pointer',
            justifyContent: isSidebarOpen ? 'flex-start' : 'center',
            marginTop: '20px'
          }}
        >
          <LogOut size={22} />
          {isSidebarOpen && <span style={{ fontWeight: 600 }}>Sair</span>}
        </button>
      </motion.aside>

      {/* Conteúdo Principal */}
      <main style={{ flex: 1, padding: '30px', overflowX: 'hidden' }}>
        <header style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#2D1B14' }}>
            {activeTab === 'orders' ? 'Painel de Pedidos' : activeTab === 'menu' ? 'Gestão do Cardápio' : 'Gestão Financeira'}
          </h1>
          <p style={{ opacity: 0.5 }}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
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
                      borderRadius: '24px',
                      padding: '25px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                      border: '1px solid #f1f5f9',
                      borderLeft: `8px solid ${order.status === 'pendente' ? '#EC9424' : '#22c55e'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <span style={{ fontWeight: 800, fontSize: '20px', color: '#2D1B14' }}>#{order.id}</span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '12px', opacity: 0.5 }}>{new Date(order.created_at || order.timestamp).toLocaleTimeString()}</span>
                        <span className="cart-item-price" style={{ fontSize: '18px', fontWeight: 800, color: '#EC9424' }}>R$ {order.total.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Itens do Pedido</div>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid #f8fafc' }}>
                          <span style={{ fontWeight: 500 }}>{item.name}</span>
                          <span style={{ opacity: 0.6 }}>R${item.price.toFixed(2).replace('.', ',')}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '16px' }}>
                      <div style={{ fontWeight: 700, fontSize: '11px', marginBottom: '6px', color: '#94a3b8' }}>ENTREGA EM:</div>
                      {order.address ? (
                        <div style={{ fontSize: '14px', lineHeight: '1.4', color: '#334155' }}>
                          <strong>{order.address.street}, {order.address.number}</strong><br/>
                          {order.address.neighborhood}
                          {order.address.complement && <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>📝 {order.address.complement}</div>}
                        </div>
                      ) : (
                        <div style={{ fontSize: '13px', color: '#ef4444' }}>Endereço não informado</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        className="checkout-btn" 
                        style={{ flex: 1, height: '48px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onClick={() => handlePrint(order)}
                        disabled={isPrinting}
                      >
                        <Printer size={18} /> {isSidebarOpen ? 'Imprimir' : ''}
                      </button>
                      {order.status === 'pendente' && (
                        <button 
                          className="checkout-btn" 
                          style={{ flex: 1, height: '48px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                          onClick={() => updateStatus(order.id, 'concluido')}
                        >
                          <CheckCircle size={18} /> {isSidebarOpen ? 'Pronto' : ''}
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
                <p>Nenhum pedido hoje ainda...</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'menu' && appMenuData && (
          <div style={{ background: 'white', borderRadius: '24px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
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

        {activeTab === 'finance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              <div style={{ background: 'white', padding: '25px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
                <div style={{ color: '#22c55e', background: '#f0fdf4', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
                  <TrendingUp size={24} />
                </div>
                <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Faturamento (Pedidos)</span>
                <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '5px 0', color: '#2D1B14' }}>R$ {totalRevenue.toFixed(2).replace('.', ',')}</h2>
              </div>
              <div style={{ background: 'white', padding: '25px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
                <div style={{ color: '#ef4444', background: '#fef2f2', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
                  <ArrowDownCircle size={24} />
                </div>
                <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Total de Despesas</span>
                <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '5px 0', color: '#2D1B14' }}>R$ {totalExpenses.toFixed(2).replace('.', ',')}</h2>
              </div>
              <div style={{ background: 'white', padding: '25px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
                <div style={{ color: '#EC9424', background: '#fff9f0', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
                  <DollarSign size={24} />
                </div>
                <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Lucro Líquido Estimado</span>
                <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '5px 0', color: '#2D1B14' }}>R$ {netProfit.toFixed(2).replace('.', ',')}</h2>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px', alignItems: 'flex-start' }}>
              {/* Transactions List */}
              <div style={{ background: 'white', borderRadius: '24px', padding: '25px', boxShadow: '0 4px 30px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9' }}>
                <h3 style={{ marginBottom: '20px', fontWeight: 800 }}>Histórico de Lançamentos</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {financeTransactions.length === 0 && orders.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '40px', opacity: 0.4 }}>Sem movimentações registradas.</p>
                  ) : (
                    <>
                      {financeTransactions.map(trans => (
                        <div key={trans.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', borderRadius: '16px', background: '#f8fafc' }}>
                          <ArrowDownCircle color="#ef4444" size={24} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700 }}>{trans.description}</div>
                            <div style={{ fontSize: '12px', opacity: 0.5 }}>{new Date(trans.created_at).toLocaleString()}</div>
                          </div>
                          <span style={{ fontWeight: 800, color: '#ef4444' }}>- R$ {trans.amount.toFixed(2).replace('.', ',')}</span>
                        </div>
                      ))}
                      {orders.map(order => (
                        <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', borderRadius: '16px', background: '#f0fdf4' }}>
                          <ArrowUpCircle color="#22c55e" size={24} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700 }}>Pedido #{order.id}</div>
                            <div style={{ fontSize: '12px', opacity: 0.5 }}>{new Date(order.created_at || order.timestamp).toLocaleString()}</div>
                          </div>
                          <span style={{ fontWeight: 800, color: '#22c55e' }}>+ R$ {order.total.toFixed(2).replace('.', ',')}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Add Expense Form */}
              <div style={{ background: '#2D1B14', color: 'white', borderRadius: '24px', padding: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginBottom: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={20} color="#EC9424" /> Novo Lançamento
                </h3>
                <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '20px' }}>Registre saídas como compras de insumos, embalagens, etc.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <input 
                    type="text" 
                    placeholder="Descrição (ex: Carne moída)" 
                    value={newExpense.description}
                    onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '15px', borderRadius: '12px', color: 'white', outline: 'none' }}
                  />
                  <input 
                    type="number" 
                    placeholder="Valor R$ (ex: 45.00)" 
                    value={newExpense.amount}
                    onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '15px', borderRadius: '12px', color: 'white', outline: 'none' }}
                  />
                  <button 
                    onClick={handleAddExpense}
                    style={{ background: '#EC9424', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', marginTop: '10px' }}
                  >
                    Salvar Saída
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
