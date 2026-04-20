import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, Printer, Bell, CheckCircle, Clock, 
  RefreshCcw, ChevronRight, LayoutDashboard, Settings, Edit, Plus, Trash2, Save, X, Image as ImageIcon,
  DollarSign, ArrowUpCircle, ArrowDownCircle, TrendingUp, LogOut, Menu, ChevronLeft, MapPin, MessageSquare,
  LayoutList, LayoutGrid, Rows3, Search, Home, ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { printOrder, formatOrderForPrinter, connectToPrinter, sendToPrinter } from './utils/printer';
import { getMenuData, saveMenuData } from './utils/menuStore';
import { supabase } from './utils/supabase';
import { FinanceDashboard } from './FinanceDashboard';
import { OrdersKanban } from './OrdersKanban';

const HistoryIcon = ({ size = 24, className, style, isActive }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{
      ...style,
      filter: isActive ? 'drop-shadow(0 0 8px rgba(0,243,255,0.8))' : 'opacity(0.6)',
      transition: 'all 0.3s ease'
    }}
  >
    <rect x="6" y="4" width="12" height="16" rx="3" stroke={isActive ? "#00f3ff" : "white"} strokeWidth="1.8"/>
    <rect x="9" y="2.5" width="6" height="3" rx="1.2" stroke={isActive ? "#00f3ff" : "white"} strokeWidth="1.8"/>
    <line x1="8.5" y1="9" x2="15.5" y2="9" stroke={isActive ? "#00f3ff" : "white"} strokeWidth="1.6" strokeLinecap="round"/>
    <line x1="8.5" y1="12" x2="15.5" y2="12" stroke={isActive ? "#00f3ff" : "white"} strokeWidth="1.6" strokeLinecap="round"/>
    <line x1="8.5" y1="15" x2="13" y2="15" stroke={isActive ? "#00f3ff" : "white"} strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

const MoneyBagIcon = ({ size = 24, className, style, isActive }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 512 512" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ 
      ...style, 
      display: 'inline-block',
      verticalAlign: 'middle',
      filter: isActive 
        ? 'drop-shadow(0 0 8px rgba(0,243,255,0.8))' 
        : 'opacity(0.6)',
      transition: 'all 0.3s ease'
    }}
    className={className}
  >
    <rect width="512" height="512" fill="none"/>
    {/* topo do saco */}
    <path
      d="M180 92 L256 58 L332 92 L296 178 L216 178 Z"
      fill={isActive ? "#00f3ff" : "white"}
    />
    {/* laterais do topo */}
    <path
      d="M170 108 C140 120, 126 146, 142 170 L204 236 L230 176 Z"
      fill={isActive ? "#00f3ff" : "white"}
    />
    <path
      d="M342 108 C372 120, 386 146, 370 170 L308 236 L282 176 Z"
      fill={isActive ? "#00f3ff" : "white"}
    />
    {/* amarração */}
    <rect x="190" y="176" width="132" height="18" rx="9" fill="black"/>
    {/* corpo do saco */}
    <path
      d="M198 192 C112 244, 52 338, 52 420 C52 478, 92 506, 162 506 H350 C420 506, 460 478, 460 420 C460 338, 400 244, 314 192 Z"
      fill={isActive ? "#00f3ff" : "white"}
    />
    {/* símbolo de dinheiro */}
    <text
      x="256"
      y="374"
      text-anchor="middle"
      dominant-baseline="middle"
      font-size="170"
      font-family="Arial, Helvetica, sans-serif"
      font-weight="700"
      fill="black"
    >
      $
    </text>
  </svg>
);

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'menu', 'finance'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pendente', 'concluido'
  const [dateFilter, setDateFilter] = useState('today'); // 'today', 'all'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [orders, setOrders] = useState([]);
  const [dbError, setDbError] = useState(null);
  const [lastSync, setLastSync] = useState(new Date());
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPrinterReady, setIsPrinterReady] = useState(false);
  const [isAutoPrint, setIsAutoPrint] = useState(false);
  const printerRef = useRef(null);
  const lastOrderId = useRef(null);
  
  // Finance State
  const [financeTransactions, setFinanceTransactions] = useState([]);
  const [financeCategories, setFinanceCategories] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'grid', 'compact'
  const [defaultCategories] = useState([
    { id: '1', name: 'Suprimentos', color: '#3b82f6' },
    { id: '2', name: 'Contas', color: '#ef4444' },
    { id: '3', name: 'Funcionários', color: '#10b981' },
    { id: '4', name: 'Manutenção', color: '#f59e0b' },
  ]);
  
  // Menu State
  const [appMenuData, setAppMenuData] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const playNotificationSound = () => {
    const audio = new Audio('/images/noticacaoshopify.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Áudio aguardando interação:", e));
    
    // Corta o áudio após 1 segundo
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 1000);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    // Check Persistence
    const savedAuth = localStorage.getItem('melburguers_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Only fetch menu data on client after auth
    setAppMenuData(getMenuData());
  }, []);

    const fetchOrders = async () => {
    if (!isAuthenticated) return;
    
    try {
      setDbError(null);
      
      const { data: activeData, error: activeError } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (activeError) {
        setDbError("Erro na tabela pedidos: " + activeError.message);
      }

      const { data: deletedData, error: deletedError } = await supabase
        .from('pedidos_excluidos')
        .select('*')
        .order('created_at', { ascending: false });

      const combined = [
        ...(activeData || []),
        ...(deletedData || [])
      ].map(o => ({
        ...o,
        original_db_id: o.id,
        id: o.order_id || o.id
      }));

      setOrders(combined);
      setLastSync(new Date());
    } catch (err) {
      console.error("CRITICAL SYNC ERROR:", err);
      setDbError("Erro crítico de sincronização.");
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
        saveMenuData(data.data);
      } else if (error && error.code === 'PGRST116') {
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

      const channel = supabase
        .channel('global-sync')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          fetchOrders();
        })
        .subscribe();

      const polling = setInterval(() => {
        fetchOrders();
      }, 7000);

      const channelExcluidos = supabase
        .channel('excluidos_realtime')
        .on('postgres_changes', { event: 'INSERT', table: 'pedidos_excluidos' }, () => {
          fetchOrders();
        })
        .subscribe();

      const channelFinance = supabase
        .channel('finance_realtime')
        .on('postgres_changes', { event: '*', table: 'finance' }, () => {
          fetchFinanceData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(channelExcluidos);
        supabase.removeChannel(channelFinance);
        clearInterval(polling);
      };
    }
  }, [isAuthenticated]);

  const fetchFinanceData = async () => {
    try {
      const { data: transData } = await supabase
        .from('finance')
        .select('*')
        .order('created_at', { ascending: false });
      if (transData) setFinanceTransactions(transData);

      const { data: cats, error: catError } = await supabase
        .from('categorias')
        .select('*');
      
      if (cats && cats.length > 0) {
        setFinanceCategories(cats);
      } else if (!catError) {
        const defaultCats = [
          { name: 'Suprimentos', color: '#3b82f6' },
          { name: 'Contas', color: '#ef4444' },
          { name: 'Funcionários', color: '#10b981' },
          { name: 'Manutenção', color: '#f59e0b' },
          { name: 'iFood', color: '#ea1d2c' }
        ];
        const { data: newCats } = await supabase.from('categorias').insert(defaultCats).select();
        if (newCats) setFinanceCategories(newCats);
      }
    } catch (err) {
      console.error("Erro financeiro profundo:", err);
    }
  };

  const handleAddTransaction = async (newTrans) => {
    if (!newTrans.description || isNaN(parseFloat(newTrans.amount))) {
      alert("Preencha a descrição e um valor válido.");
      return;
    }

    try {
      const payload = { 
        description: newTrans.description, 
        amount: parseFloat(newTrans.amount), 
        type: newTrans.type,
        category_id: newTrans.categoryId || null,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('finance')
        .insert([payload])
        .select();

      if (error) throw error;
      
      if (data) {
        setFinanceTransactions(current => {
          if (current.some(t => t.id === data[0].id)) return current;
          return [data[0], ...current];
        });
      }
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await supabase.from('finance').delete().eq('id', id);
      setFinanceTransactions(current => current.filter(t => t.id !== id));
    } catch (err) { alert("Erro ao excluir transação"); }
  };

  const handleUpdateTransaction = async (id, updatedData) => {
    try {
      const { data } = await supabase.from('finance')
        .update({
          description: updatedData.description,
          amount: parseFloat(updatedData.amount),
          category_id: updatedData.categoryId
        })
        .eq('id', id)
        .select();
      if (data) {
        setFinanceTransactions(current => current.map(t => t.id === id ? data[0] : t));
      }
    } catch (err) { alert("Erro ao atualizar transação"); }
  };

  const handleAddCategory = async (newCat) => {
    const exists = financeCategories.some(c => c.name.toLowerCase() === newCat.name.toLowerCase());
    if (exists) {
      alert("Esta categoria já existe!");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categorias')
        .insert([{ 
          name: newCat.name, 
          color: newCat.color 
        }])
        .select();
      
      if (data) {
        setFinanceCategories(current => [...current, data[0]]);
      } else if (error) {
        if (error.code === '23505') {
          alert("Esta categoria já existe no banco de dados!");
        } else {
          throw error;
        }
      }
    } catch (err) { 
      alert("Erro ao salvar categoria no banco. Verifique sua conexão.");
    }
  };

  useEffect(() => {
    if (orders.length > 0 && isAuthenticated) {
      const latestOrder = orders[0];
      if (latestOrder.id !== lastOrderId.current) {
        if (lastOrderId.current !== null) {
          playNotificationSound();
        }
        lastOrderId.current = latestOrder.id;
        
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

  const handlePrinterConnect = async () => {
    const characteristic = await connectToPrinter();
    if (characteristic) {
      printerRef.current = characteristic;
      setIsPrinterReady(true);
      alert("Impressora conectada com sucesso!");
    } else {
      setIsPrinterReady(false);
      alert("Não foi possível conectar à impressora.");
    }
  };

  const handlePrint = async (order) => {
    setIsPrinting(true);
    const printerData = formatOrderForPrinter(order.items, order.total, order.address);
    
    try {
      if (printerRef.current) {
        await sendToPrinter(printerRef.current, printerData);
      } else {
        const success = await printOrder(printerData);
        if (!success) throw new Error("Falha na impressão");
      }
    } catch (err) {
      alert("Erro ao imprimir. Verifique a conexão com a impressora.");
    } finally {
      setIsPrinting(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    setOrders(current => current.map(o => 
      (o.order_id === id || String(o.id) === String(id)) ? { ...o, status: newStatus } : o
    ));

    try {
      if (newStatus === 'excluido') {
        const orderToMove = orders.find(o => o.order_id === id || String(o.id) === String(id));
        if (orderToMove) {
          const dbId = orderToMove.original_db_id;
          const { id: oldId, created_at: oldDate, original_db_id: oldDbId, ...orderData } = orderToMove;
          
          const { error: insertError } = await supabase
            .from('pedidos_excluidos')
            .insert([{ ...orderData, status: 'excluido' }]);
          
          if (!insertError) {
             await supabase.from('pedidos').delete().eq('id', dbId);
          }
        }
      } else {
        const itemBeforeUpdate = orders.find(o => o.order_id === id || String(o.id) === String(id));
        
        if (itemBeforeUpdate && itemBeforeUpdate.status === 'excluido') {
          const dbId = itemBeforeUpdate.original_db_id;
          const { id: oldId, created_at: oldDate, original_db_id: oldDbId, ...orderData } = itemBeforeUpdate;

          const { error: insertError } = await supabase
            .from('pedidos')
            .insert([{ ...orderData, status: newStatus }]);
          
          if (!insertError) {
            await supabase.from('pedidos_excluidos').delete().eq('id', dbId);
          }
        } else {
          const dbId = itemBeforeUpdate?.original_db_id;
          if (dbId) {
            await supabase.from('pedidos')
              .update({ status: newStatus })
              .eq('id', dbId);
          }
        }
      }
    } catch (err) {
      fetchOrders();
    }
  };

  const handleSaveMenu = async (newMenu) => {
    setAppMenuData(newMenu);
    saveMenuData(newMenu);
    try {
      await supabase.from('menu_config').update({ data: newMenu }).eq('id', 1);
    } catch (err) {
      console.log("Erro ao salvar menu na nuvem:", err);
    }
  };

  const handleEditItem = (category, item) => {
    setEditingCategory(category);
    setEditingItem({...item});
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
    editingItem.price = parseFloat(editingItem.price);
    if(editingItem.original_price) {
        editingItem.original_price = parseFloat(editingItem.original_price);
    }
    if (!editingItem.id) {
      editingItem.id = Date.now().toString();
      newMenu.menu[editingCategory].push(editingItem);
    } else {
      const index = newMenu.menu[editingCategory].findIndex(i => i.id === editingItem.id);
      newMenu.menu[editingCategory][index] = editingItem;
    }
    handleSaveMenu(newMenu);
    setEditingItem(null);
    setEditingCategory(null);
  };

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at || order.timestamp);
    const today = new Date();
    const isToday = orderDate.toLocaleDateString() === today.toLocaleDateString();
    
    if (statusFilter === 'concluded') return order.status === 'concluido';
    if (statusFilter === 'deleted') return order.status === 'excluido';
    if (order.status === 'excluido') return false;
    if (dateFilter === 'today' && !isToday) return false;
    if (statusFilter === 'pending' && order.status !== 'pendente' && order.status !== 'pago') return false;
    
    return true;
  }).sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp));

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0b', padding: '20px' }}>
        <form onSubmit={handleLogin} style={{ background: '#161618', padding: '40px', borderRadius: '32px', boxShadow: '0 25px 50px rgba(0,0,0,0.6)', maxWidth: '400px', width: '100%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ marginBottom: '30px' }}>
            <img src="/images/logo.png" alt="Mel Burgers" style={{ width: '80px', height: '80px', borderRadius: '22px', border: '2px solid #EC9424', boxShadow: '0 0 20px rgba(236,148,36,0.2)' }} />
          </div>
          <h2 style={{ color: '#ffffff', marginBottom: '8px', fontSize: '24px', fontWeight: 900 }}>Painel Admin</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '30px' }}>Inicie sua sessão para gerenciar pedidos</p>
          <input 
            type="password" 
            placeholder="Senha de Acesso"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: '#000000', color: 'white', marginBottom: '20px', fontSize: '16px', outline: 'none' }}
          />
          <button type="submit" style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #EC9424 0%, #d97706 100%)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 20px rgba(236,148,36,0.15)' }}>
            Entrar no Sistema
          </button>
          <p style={{ marginTop: '20px', fontSize: '12px', color: '#64748b' }}>Acesso restrito • Mel Burgers</p>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-layout" style={{ 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row',
      minHeight: '100vh', 
      background: '#050506',
      color: '#e2e8f0',
      fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif"
    }}>
      {!isMobile && (
        <motion.aside 
          initial={false}
          animate={{ width: isSidebarOpen ? '280px' : '88px' }}
          style={{
            background: '#050506',
            color: 'white',
            padding: '32px 16px',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: 0,
            height: '100vh',
            zIndex: 100,
            borderRight: '1px solid rgba(255,255,255,0.04)'
          }}
        >
          <div style={{ padding: '0 8px', marginBottom: '48px', display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'space-between' : 'center' }}>
            {isSidebarOpen ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #EC9424 0%, #d97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontWeight: 900, fontSize: '18px', color: 'white' }}>M</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: '#ffffff' }}>MELBURGERS</span>
                  <span style={{ fontSize: '10px', color: '#52525b', fontWeight: 600 }}>ADMIN PANEL</span>
                </div>
              </div>
            ) : (
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '14px', color: '#EC9424' }}>M</span>
              </div>
            )}
            {isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: '#52525b', cursor: 'pointer' }}><ChevronLeft size={16} /></button>
            )}
          </div>
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { id: 'orders', icon: LayoutDashboard, label: 'Operações' },
              { id: 'menu', icon: ShoppingBag, label: 'Cardápio' },
              { id: 'finance', icon: DollarSign, label: 'Financeiro' },
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                    color: isActive ? '#ffffff' : '#a1a1aa',
                    cursor: 'pointer',
                    justifyContent: isSidebarOpen ? 'flex-start' : 'center'
                  }}
                >
                  <item.icon size={18} color={isActive ? '#EC9424' : 'currentColor'} />
                  {isSidebarOpen && <span style={{ fontSize: '13px' }}>{item.label}</span>}
                </button>
              );
            })}
          </nav>
          <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', border: 'none', cursor: 'pointer', justifyContent: isSidebarOpen ? 'flex-start' : 'center' }}>
              <LogOut size={16} />
              {isSidebarOpen && <span>Sair</span>}
            </button>
          </div>
        </motion.aside>
      )}

      <main style={{ flex: 1, padding: isMobile ? '20px' : '40px 50px', paddingBottom: isMobile ? '120px' : '40px', overflowY: 'auto', height: '100vh' }}>
        {activeTab !== 'finance' && (
          <header style={{ marginBottom: isMobile ? '24px' : '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 700, color: '#f8fafc' }}>
                {activeTab === 'menu' ? 'Cardápio' : 'Operações'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '11px', color: '#71717a' }}>Online • {lastSync.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {isMobile && (
                <button onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')} style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#EC9424' }}>
                  {viewMode === 'list' ? <LayoutGrid size={18} /> : <LayoutList size={18} />}
                </button>
              )}
              <button onClick={playNotificationSound} style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#EC9424' }}>
                <Bell size={18} />
              </button>
            </div>
          </header>
        )}

        {(activeTab === 'orders' || activeTab === 'orders-history' || activeTab === 'search') && (
          <>
            <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isMobile ? 'column' : 'row', gap: '15px' }}>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', width: isMobile ? '100%' : 'auto' }}>
                <button 
                  onClick={() => setDateFilter(dateFilter === 'today' ? 'all' : 'today')}
                  style={{ padding: '8px 16px', borderRadius: '12px', background: dateFilter === 'today' ? 'rgba(236,148,36,0.1)' : 'rgba(255,255,255,0.03)', color: dateFilter === 'today' ? '#EC9424' : '#71717a', border: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }}
                >
                  {dateFilter === 'today' ? 'Hoje' : 'Sempre'}
                </button>
                {['all', 'pending', 'concluded', 'deleted'].map(f => (
                  <button 
                    key={f} 
                    onClick={() => setStatusFilter(f)}
                    style={{ padding: '8px 16px', borderRadius: '12px', background: statusFilter === f ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', color: statusFilter === f ? 'white' : '#71717a', border: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }}
                  >
                    {f === 'all' ? 'Geral' : f === 'pending' ? 'Abertos' : f === 'concluded' ? 'Finais' : 'Lixo'}
                  </button>
                ))}
              </div>
              <button onClick={handlePrinterConnect} style={{ padding: '8px 16px', borderRadius: '12px', background: isPrinterReady ? 'rgba(34,197,94,0.1)' : 'transparent', color: isPrinterReady ? '#22c55e' : '#71717a', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={14} /> {isPrinterReady ? 'Pronto' : 'Imprimir'}
              </button>
            </div>
            <OrdersKanban orders={filteredOrders} updateStatus={updateStatus} handlePrint={handlePrint} statusFilter={statusFilter} viewMode={viewMode} />
          </>
        )}

        {activeTab === 'menu' && appMenuData && (
          <div style={{ background: '#161618', borderRadius: '32px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {editingItem ? (
              <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <input placeholder="Nome" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} style={{ padding: '16px', borderRadius: '12px', background: '#000', color: '#fff', border: '1px solid #333' }} />
                <input placeholder="Preço" type="number" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: e.target.value})} style={{ padding: '16px', borderRadius: '12px', background: '#000', color: '#fff', border: '1px solid #333' }} />
                <textarea placeholder="Descrição" value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} style={{ padding: '16px', borderRadius: '12px', background: '#000', color: '#fff', border: '1px solid #333', minHeight: '100px' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleSaveEdit} style={{ flex: 1, padding: '16px', background: '#EC9424', color: '#fff', borderRadius: '12px', fontWeight: 800 }}>SALVAR</button>
                  <button onClick={() => setEditingItem(null)} style={{ flex: 1, padding: '16px', background: '#333', color: '#fff', borderRadius: '12px' }}>CANCELAR</button>
                </div>
              </div>
            ) : (
              Object.keys(appMenuData.menu).map(cat => (
                <div key={cat} style={{ marginBottom: '30px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{cat}</h3>
                    <button onClick={() => { setEditingCategory(cat); setEditingItem({name:'', price:'', description:'', image:''}) }} style={{ color: '#EC9424', fontSize: '12px', fontWeight: 800 }}>+ ITEM</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                    {appMenuData.menu[cat].map(item => (
                      <div key={item.id} style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14px' }}>{item.name}</div>
                          <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: 800 }}>R$ {item.price.toFixed(2)}</div>
                        </div>
                        <button onClick={() => handleEditItem(cat, item)}><Edit size={16} color="#EC9424" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'finance' && (
          <FinanceDashboard 
            orders={orders.filter(o => o.status === 'concluido' || o.status === 'pago')}
            transactions={financeTransactions}
            categories={financeCategories}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onAddCategory={handleAddCategory}
            playNotificationSound={playNotificationSound}
            handlePrinterConnect={handlePrinterConnect}
            isPrinterReady={isPrinterReady}
          />
        )}
      </main>

      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 5000 }}>
          <motion.nav style={{ height: '115px', position: 'relative' }}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '166%', transform: 'translateY(-66px)' }} viewBox="0 0 390 115" preserveAspectRatio="none">
                <path d="M0,72 C100,64 150,62 195,62 C240,62 290,64 390,72 L390,104 C290,96 240,94 195,94 C150,94 100,96 0,104 Z" fill="rgba(5, 5, 7, 0.94)" style={{ backdropFilter: 'blur(8px)' }} />
                <path d="M0,102 C100,94 150,92 195,92 C240,92 290,94 390,102 V115 H0 Z" fill="#121215" />
                <motion.path
                  d="M0,102 C100,94 150,92 195,92 C240,92 290,94 390,102"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 8px #00f3ff)' }}
                  animate={{
                    strokeDasharray: "44 350",
                    strokeDashoffset: `${[
                      -26,   // Histórico
                      -99,   // Cardápio
                      -173,  // Busca
                      -246,  // Financeiro
                      -320   // Pedidos
                    ][['orders-history', 'menu', 'search', 'finance', 'orders'].indexOf(activeTab)]}px`
                  }}
                  transition={{ type: "spring", stiffness: 220, damping: 26 }}
                />
              </svg>

              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '191%', zIndex: 20, pointerEvents: 'none' }} viewBox="0 0 390 115" preserveAspectRatio="none">
                <path d="M0,28 C100,20 150,18 195,18 C240,18 290,20 390,28" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
              </svg>

              <motion.div
                style={{ position: 'absolute', top: '25px', width: '110px', height: '60px', marginLeft: '-55px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(160,200,255,0.22), transparent 72%)', filter: 'blur(15px)', zIndex: 2 }}
                animate={{ left: (['orders-history', 'menu', 'search', 'finance', 'orders'].indexOf(activeTab) * 20 + 10) + '%' }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
              />

              <div style={{ position: 'absolute', top: '42px', left: 0, right: 0, padding: '0 24px', zIndex: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <LayoutGroup>
                    {[
                      { id: 'orders-history', icon: HistoryIcon, offset: 8 },
                      { id: 'menu', icon: ShoppingBag, offset: 0 },
                      { id: 'search', icon: Search, offset: -12 },
                      { id: 'finance', icon: MoneyBagIcon, offset: 0 },
                      { id: 'orders', icon: Home, offset: 8 }
                    ].map((item) => {
                      const isActive = activeTab === item.id;
                      return (
                        <motion.button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          style={{ width: '48px', background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                          animate={{ y: item.offset }}
                        >
                          <motion.div style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} animate={{ opacity: isActive ? 1 : 0.6 }}>
                            <item.icon size={24} isActive={isActive} color="#ffffff" style={{ transform: item.id === 'search' ? 'translateY(7px)' : 'none' }} />
                          </motion.div>
                        </motion.button>
                      );
                    })}
                  </LayoutGroup>
                </div>
              </div>

              <div style={{ position: 'absolute', bottom: '5px', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{ fontSize: '12px', fontWeight: '500', color: '#ffffff', letterSpacing: '2.5px', textTransform: 'uppercase', textShadow: '0 0 12px rgba(0, 243, 255, 0.6)' }}
                  >
                    {activeTab === 'orders' ? 'Pedidos' : activeTab === 'menu' ? 'Cardápio' : activeTab === 'search' ? 'Explorar' : activeTab === 'finance' ? 'Financeiro' : 'Histórico'}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </motion.nav>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
