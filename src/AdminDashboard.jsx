import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, Printer, Bell, CheckCircle, Clock, 
  RefreshCcw, ChevronRight, LayoutDashboard, Settings, Edit, Plus, Trash2, Save, X, Image as ImageIcon,
  DollarSign, ArrowUpCircle, ArrowDownCircle, TrendingUp, LogOut, Menu, ChevronLeft, MapPin, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { printOrder, formatOrderForPrinter, connectToPrinter, sendToPrinter } from './utils/printer';
import { getMenuData, saveMenuData } from './utils/menuStore';
import { supabase } from './utils/supabase';
import { FinanceDashboard } from './FinanceDashboard';
import { OrdersKanban } from './OrdersKanban';

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'menu', 'finance'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pendente', 'concluido'
  const [dateFilter, setDateFilter] = useState('today'); // 'today', 'all'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [orders, setOrders] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPrinterReady, setIsPrinterReady] = useState(false);
  const [isAutoPrint, setIsAutoPrint] = useState(false);
  const printerRef = useRef(null);
  const lastOrderId = useRef(null);
  
  // Finance State
  const [financeTransactions, setFinanceTransactions] = useState([]);
  const [financeCategories, setFinanceCategories] = useState([
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
      const [pedidosRes, excluidosRes] = await Promise.all([
        supabase.from('pedidos').select('*').order('created_at', { ascending: false }),
        supabase.from('pedidos_excluidos').select('*').order('created_at', { ascending: false })
      ]);
      
      const combinedData = [
        ...(pedidosRes.data || []),
        ...(excluidosRes.data || [])
      ].map(o => ({
        ...o,
        original_db_id: o.id, // ID real do banco (UUID ou Serial)
        id: o.order_id || o.id // ID visual para o sistema
      }));
      
      setOrders(combinedData);
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

      // Realtime do Supabase - Assina ambas as tabelas
      const channelPedidos = supabase
        .channel('pedidos_realtime')
        .on('postgres_changes', { event: 'INSERT', table: 'pedidos' }, (payload) => {
          const newOrder = { ...payload.new, id: payload.new.order_id || payload.new.id };
          setOrders(current => [newOrder, ...current]);
        })
        .subscribe();

      const channelExcluidos = supabase
        .channel('excluidos_realtime')
        .on('postgres_changes', { event: 'INSERT', table: 'pedidos_excluidos' }, (payload) => {
          const newOrder = { ...payload.new, id: payload.new.order_id || payload.new.id };
          setOrders(current => [newOrder, ...current]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channelPedidos);
        supabase.removeChannel(channelExcluidos);
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
      const { data: cats } = await supabase.from('finance_categories').select('*');
      if (cats && cats.length > 0) setFinanceCategories(cats);
    } catch (err) {
      console.error("Erro financeiro:", err);
    }
  };

  const handleAddTransaction = async (newTrans) => {
    try {
      const { data } = await supabase.from('finance').insert([{ 
        description: newTrans.description, 
        amount: parseFloat(newTrans.amount), 
        type: newTrans.type,
        category_id: newTrans.categoryId || null
      }]).select();
      if (data) setFinanceTransactions([data[0], ...financeTransactions]);
    } catch (err) { alert("Erro ao salvar transação"); }
  };

  const handleAddCategory = async (newCat) => {
    try {
      const { data } = await supabase.from('finance_categories').insert([newCat]).select();
      if (data) setFinanceCategories([...financeCategories, data[0]]);
    } catch (err) { 
      setFinanceCategories([...financeCategories, { ...newCat, id: Date.now().toString() }]);
    }
  };

  useEffect(() => {
    if (orders.length > 0 && isAuthenticated) {
      const latestOrder = orders[0];
      if (latestOrder.id !== lastOrderId.current) {
        // Toca o som apenas se não for o primeiro carregamento da página
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
        // Se não houver conexão prévia, tenta conectar e imprimir na hora
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
    console.log(`Atualizando status de ${id} para ${newStatus}`);
    
    // Optimistic Update
    setOrders(current => current.map(o => 
      (o.order_id === id || String(o.id) === String(id)) ? { ...o, status: newStatus } : o
    ));

    try {
      if (newStatus === 'excluido') {
        const orderToMove = orders.find(o => o.order_id === id || String(o.id) === String(id));
        if (orderToMove) {
          const dbId = orderToMove.original_db_id;
          
          // Prepara os dados para inserção (remove IDs antigos para evitar conflito de chave primária)
          const { id: oldId, created_at: oldDate, original_db_id: oldDbId, ...orderData } = orderToMove;
          
          const { error: insertError } = await supabase
            .from('pedidos_excluidos')
            .insert([{ ...orderData, status: 'excluido' }]);
          
          if (!insertError) {
             const { error: deleteError } = await supabase.from('pedidos').delete().eq('id', dbId);
             if (deleteError) console.error("Erro ao deletar da tabela original:", deleteError);
          } else {
            console.error("Erro ao inserir em excluidos:", insertError);
          }
        }
      } else {
        const itemBeforeUpdate = orders.find(o => o.order_id === id || String(o.id) === String(id));
        
        if (itemBeforeUpdate && itemBeforeUpdate.status === 'excluido') {
          // RESTAURAÇÃO
          const dbId = itemBeforeUpdate.original_db_id;
          const { id: oldId, created_at: oldDate, original_db_id: oldDbId, ...orderData } = itemBeforeUpdate;

          const { error: insertError } = await supabase
            .from('pedidos')
            .insert([{ ...orderData, status: newStatus }]);
          
          if (!insertError) {
            await supabase.from('pedidos_excluidos').delete().eq('id', dbId);
          }
        } else {
          // Atualização Normal
          const dbId = itemBeforeUpdate?.original_db_id;
          if (dbId) {
            await supabase.from('pedidos')
              .update({ status: newStatus })
              .eq('id', dbId);
          }
        }
      }
    } catch (err) {
      console.error("Erro ao processar transição de tabelas/status:", err);
      fetchOrders(); // Recarrega em caso de erro para sincronizar
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


  const filteredFinanceOrders = orders.filter(o => {
    const isPaidOrDone = o.status === 'pago' || o.status === 'concluido';
    if (!isPaidOrDone) return false;

    if (dateFilter === 'today') {
      const orderDate = new Date(o.created_at || o.timestamp);
      const today = new Date();
      return orderDate.getDate() === today.getDate() && 
             orderDate.getMonth() === today.getMonth() && 
             orderDate.getFullYear() === today.getFullYear();
    }
    return true;
  });

  const totalRevenue = filteredFinanceOrders.reduce((acc, order) => acc + (order.total || 0), 0);

  const filteredExpenses = financeTransactions.filter(trans => {
    if (dateFilter === 'today') {
      const transDate = new Date(trans.created_at);
      const today = new Date();
      return transDate.getDate() === today.getDate() && 
             transDate.getMonth() === today.getMonth() && 
             transDate.getFullYear() === today.getFullYear();
    }
    return true;
  });

  const totalExpenses = filteredExpenses.reduce((acc, trans) => acc + (trans.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at || order.timestamp);
    const today = new Date();
    const isToday = orderDate.getDate() === today.getDate() && 
                    orderDate.getMonth() === today.getMonth() && 
                    orderDate.getFullYear() === today.getFullYear();
    
    // Se estiver na aba de Concluídos, só mostra concluídos
    if (statusFilter === 'concluded') return order.status === 'concluido';
    
    // Se estiver na aba de Excluídos, só mostra excluídos
    if (statusFilter === 'deleted') return order.status === 'excluido';

    // Se NÃO estiver na aba de Excluídos, esconde apenas excluídos (concluídos aparecem na Fila Geral agora)
    if (order.status === 'excluido') return false;

    // Filtros adicionais de Data e Status
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
      {/* Sidebar UIMAX Premium (Desktop) */}
      {!isMobile && (
        <motion.aside 
          initial={false}
          animate={{ width: isSidebarOpen ? '280px' : '90px' }}
          style={{
            background: '#050506',
            color: 'white',
            padding: '30px 20px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'none',
            position: 'sticky',
            top: 0,
            height: '100vh',
            zIndex: 100,
            borderRight: '1px solid rgba(255,255,255,0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'space-between' : 'center', marginBottom: '50px' }}>
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <div style={{ position: 'relative' }}>
                  <img src="/images/logo.png" alt="Logo" style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, fontSize: '15px', letterSpacing: '-0.3px', color: '#ffffff' }}>MELBURGERS</span>
                  <span style={{ fontSize: '10px', color: '#71717a', letterSpacing: '0.5px' }}>Workspace</span>
                </div>
              </motion.div>
            )}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                color: 'white', 
                padding: '10px', 
                borderRadius: '12px', 
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isSidebarOpen ? <ChevronLeft size={18} /> : <Menu size={20} />}
            </button>
          </div>

          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { id: 'orders', icon: LayoutDashboard, label: 'Controle de Pedidos' },
              { id: 'menu', icon: ShoppingBag, label: 'Gestão de Cardápio' },
              { id: 'finance', icon: DollarSign, label: 'Financeiro App' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === item.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: activeTab === item.id ? '#ffffff' : '#71717a',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  justifyContent: isSidebarOpen ? 'flex-start' : 'center'
                }}
              >
                <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                {isSidebarOpen && <span style={{ fontWeight: activeTab === item.id ? 600 : 500, fontSize: '13px' }}>{item.label}</span>}
              </button>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              padding: '14px 18px',
              borderRadius: '16px',
              border: 'none',
              background: 'rgba(239, 68, 68, 0.05)',
              color: '#ef4444',
              cursor: 'pointer',
              justifyContent: isSidebarOpen ? 'flex-start' : 'center',
              marginTop: '20px',
              transition: 'all 0.2s',
              fontWeight: 700
            }}
          >
            <LogOut size={22} />
            {isSidebarOpen && <span>Sair do Sistema</span>}
          </button>
        </motion.aside>
      )}

      {/* Main Content Area */}
      <main style={{ 
        flex: 1, 
        padding: isMobile ? '20px' : '40px 50px', 
        paddingBottom: isMobile ? '100px' : '40px',
        overflowY: 'auto' 
      }}>
        {activeTab !== 'finance' && (
          <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', flexDirection: isMobile ? 'column' : 'row', gap: '20px' }}>
            <div>
              <h1 style={{ fontSize: isMobile ? '20px' : '22px', fontWeight: 600, color: '#f8fafc', letterSpacing: '-0.5px', marginBottom: '4px' }}>
                {activeTab === 'orders' ? 'Painel de Operações' : 'Editor de Cardápio'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#71717a', fontSize: '13px', fontWeight: 400 }}>
                {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })} • Workspace ativo
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', width: isMobile ? '100%' : 'auto', alignItems: 'center' }}>
              <button 
                onClick={playNotificationSound}
                style={{ padding: '8px 14px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, transition: 'all 0.2s' }}
              >
                <Bell size={14} />
                Teste de som
              </button>
              <div style={{ padding: '8px 14px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px rgba(34,197,94,0.4)' }}></div>
                 <span style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa' }}>Realtime</span>
              </div>
            </div>
          </header>
        )}

        {activeTab === 'orders' && (
          <>
            <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isMobile ? 'column' : 'row', gap: '15px' }}>
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', width: isMobile ? '100%' : 'auto', paddingBottom: isMobile ? '10px' : '0', scrollbarWidth: 'none' }}>
                <button 
                  onClick={() => setDateFilter(dateFilter === 'today' ? 'all' : 'today')}
                  style={{ padding: '6px 14px', borderRadius: '8px', background: dateFilter === 'today' ? 'rgba(255,255,255,0.08)' : 'transparent', color: dateFilter === 'today' ? '#ffffff' : '#71717a', fontSize: '12px', fontWeight: 500, border: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  Hoje
                </button>
                <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.06)', margin: 'auto 0' }}></div>
                <button 
                  onClick={() => setStatusFilter('all')}
                  style={{ padding: '6px 14px', borderRadius: '8px', background: statusFilter === 'all' ? 'rgba(255,255,255,0.08)' : 'transparent', color: statusFilter === 'all' ? '#ffffff' : '#71717a', fontSize: '12px', fontWeight: 500, border: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  Fila Geral
                </button>
                <button 
                  onClick={() => setStatusFilter('pending')}
                  style={{ padding: '6px 14px', borderRadius: '8px', background: statusFilter === 'pending' ? 'rgba(255,255,255,0.08)' : 'transparent', color: statusFilter === 'pending' ? '#ffffff' : '#71717a', fontSize: '12px', fontWeight: 500, border: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  Em Aberto
                </button>
                <button 
                  onClick={() => setStatusFilter('concluded')}
                  style={{ padding: '6px 14px', borderRadius: '8px', background: statusFilter === 'concluded' ? 'rgba(45,212,191,0.1)' : 'transparent', color: statusFilter === 'concluded' ? '#2dd4bf' : '#71717a', fontSize: '12px', fontWeight: 500, border: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  Concluídos
                </button>
                <button 
                  onClick={() => setStatusFilter('deleted')}
                  style={{ padding: '6px 14px', borderRadius: '8px', background: statusFilter === 'deleted' ? 'rgba(244,63,94,0.1)' : 'transparent', color: statusFilter === 'deleted' ? '#f43f5e' : '#71717a', fontSize: '12px', fontWeight: 500, border: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  Excluídos
                </button>
              </div>
              
              <button 
                onClick={handlePrinterConnect}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: isPrinterReady ? 'rgba(45,212,191,0.1)' : 'transparent',
                  color: isPrinterReady ? '#2dd4bf' : '#a1a1aa',
                  border: '1px solid ' + (isPrinterReady ? 'rgba(45,212,191,0.2)' : 'rgba(255,255,255,0.06)'),
                  fontWeight: 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  width: isMobile ? '100%' : 'auto',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <Printer size={14} />
                {isPrinterReady ? 'Impressora Conectada' : 'Conectar Impressora'}
              </button>
            </div>

            <OrdersKanban orders={filteredOrders} updateStatus={updateStatus} handlePrint={handlePrint} statusFilter={statusFilter} />
          </>
        )}

        {activeTab === 'menu' && appMenuData && (
           <div style={{ background: '#161618', borderRadius: '32px', padding: isMobile ? '20px' : '40px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
              {editingItem ? (
                 <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '25px', color: '#ffffff', letterSpacing: '-0.5px' }}>
                      {editingItem.id ? 'Editar Produto' : 'Novo Produto'}
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '1px' }}>FOTO DO PRODUTO</span>
                          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div 
                              onClick={() => document.getElementById('file-upload').click()}
                              style={{ 
                                position: 'relative',
                                width: '120px', 
                                height: '120px', 
                                borderRadius: '24px', 
                                border: '2px dashed rgba(255,255,255,0.1)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                background: '#0a0a0b',
                                transition: 'all 0.3s'
                              }}
                              onMouseOver={e => e.currentTarget.style.borderColor = '#EC9424'}
                              onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                            >
                              {editingItem.image ? (
                                <img src={editingItem.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ textAlign: 'center', color: '#64748b' }}>
                                  <ImageIcon size={24} style={{ marginBottom: '8px' }} />
                                  <div style={{ fontSize: '10px', fontWeight: 700 }}>ADICIONAR</div>
                                </div>
                              )}
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '4px', fontSize: '9px', textAlign: 'center', color: 'white', fontWeight: 800 }}>ALTERAR</div>
                            </div>
                            
                            <div style={{ flex: 1 }}>
                              <input 
                                id="file-upload"
                                type="file" 
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setEditingItem({ ...editingItem, image: reader.result });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                style={{ display: 'none' }}
                              />
                              <button 
                                onClick={() => document.getElementById('file-upload').click()}
                                style={{ padding: '12px 20px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                              >
                                SELECIONAR ARQUIVO
                              </button>
                              <div style={{ marginTop: '10px', color: '#64748b', fontSize: '11px', lineHeight: '1.4' }}>
                                Clique na imagem ou no botão para subir uma foto do seu computador.
                              </div>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '1px' }}>NOME DO PRODUTO</span>
                          <input 
                            placeholder="Ex: X-Burguer Especial" 
                            value={editingItem.name} 
                            onChange={e => setEditingItem({...editingItem, name: e.target.value})} 
                            style={{ padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: '#0a0a0b', color: 'white', outline: 'none' }} 
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '1px' }}>PREÇO (R$)</span>
                          <input 
                            placeholder="0,00" 
                            type="number" 
                            value={editingItem.price} 
                            onChange={e => setEditingItem({...editingItem, price: e.target.value})} 
                            style={{ padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: '#0a0a0b', color: 'white', outline: 'none' }} 
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '1px' }}>DESCRIÇÃO DO PRODUTO</span>
                          <textarea 
                            placeholder="Ex: Pão brioche, blend 150g, queijo cheddar, alface e tomate" 
                            value={editingItem.description} 
                            onChange={e => setEditingItem({...editingItem, description: e.target.value})} 
                            style={{ padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: '#0a0a0b', color: 'white', outline: 'none', minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }} 
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                          <button onClick={handleSaveEdit} style={{ flex: 1, padding: '18px', background: 'linear-gradient(135deg, #EC9424 0%, #d97706 100%)', color: 'white', border: 'none', borderRadius: '18px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 20px rgba(236,148,36,0.2)' }}>SALVAR ALTERAÇÕES</button>
                          <button onClick={() => setEditingItem(null)} style={{ flex: 1, padding: '18px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', borderRadius: '18px', fontWeight: '700', cursor: 'pointer' }}>DESCARTAR</button>
                        </div>
                    </div>
                 </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                  {Object.keys(appMenuData.menu).map(category => (
                    <div key={category}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderLeft: '4px solid #EC9424', paddingLeft: '15px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>{category}</h3>
                        <button 
                          onClick={() => { setEditingCategory(category); setEditingItem({ name: '', price: '', description: '', image: '' }) }} 
                          style={{ background: 'rgba(236, 148, 36, 0.1)', border: '1px solid rgba(236, 148, 36, 0.2)', color: '#EC9424', fontWeight: 900, fontSize: '12px', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer' }}
                        >
                          + NOVO ITEM
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                         {appMenuData.menu[category].map(item => (
                           <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s hover' }}>
                              <img src={item.image} alt="" style={{ width: '60px', height: '60px', borderRadius: '14px', objectFit: 'cover' }} />
                              <div style={{ flex: 1 }}>
                                 <div style={{ fontWeight: 800, fontSize: '14px', color: '#e2e8f0', marginBottom: '4px' }}>{item.name}</div>
                                 <div style={{ color: '#00ff88', fontWeight: 900, fontSize: '15px' }}>R$ {parseFloat(item.price).toFixed(2).replace('.', ',')}</div>
                              </div>
                              <button 
                                onClick={() => handleEditItem(category, item)} 
                                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                              >
                                <Edit size={18} color="#EC9424" />
                              </button>
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
           <FinanceDashboard 
             orders={orders.filter(o => o.status === 'concluido' || o.status === 'pago')}
             transactions={financeTransactions}
             categories={financeCategories}
             onAddTransaction={handleAddTransaction}
             onAddCategory={handleAddCategory}
             playNotificationSound={playNotificationSound}
             handlePrinterConnect={handlePrinterConnect}
             isPrinterReady={isPrinterReady}
           />
        )}
      </main>

      {/* Mobile Bottom Navigation (UIMAX Glass) */}
      {isMobile && (
        <nav style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          right: '20px',
          height: '74px',
          background: 'rgba(45, 27, 20, 0.95)',
          backdropFilter: 'blur(15px)',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          zIndex: 1000,
          border: '1px solid rgba(255,255,255,0.1)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {[
            { id: 'orders', icon: LayoutDashboard, label: 'Pedidos' },
            { id: 'menu', icon: ShoppingBag, label: 'Cardápio' },
            { id: 'finance', icon: DollarSign, label: 'Financeiro' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                flex: '0 0 auto',
                width: '33.33%',
                minWidth: '100px',
                height: '100%',
                background: 'none',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                color: activeTab === item.id ? '#EC9424' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative'
              }}
            >
              <motion.div
                animate={{ scale: activeTab === item.id ? 1.2 : 1 }}
              >
                <item.icon size={24} />
              </motion.div>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</span>
              {activeTab === item.id && (
                <motion.div 
                  layoutId="mobileActiveDot"
                  style={{ position: 'absolute', bottom: '6px', width: '4px', height: '4px', background: '#EC9424', borderRadius: '50%' }}
                />
              )}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};

export default AdminDashboard;
