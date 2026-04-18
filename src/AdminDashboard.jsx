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

      // Realtime do Supabase - Assina todas as tabelas com proteção de duplicidade
      const channelPedidos = supabase
        .channel('pedidos_realtime')
        .on('postgres_changes', { event: 'INSERT', table: 'pedidos' }, (payload) => {
          const newOrder = { ...payload.new, id: payload.new.order_id || payload.new.id };
          setOrders(current => {
            if (current.some(o => o.id === newOrder.id)) return current;
            return [newOrder, ...current];
          });
        })
        .subscribe();

      const channelExcluidos = supabase
        .channel('excluidos_realtime')
        .on('postgres_changes', { event: 'INSERT', table: 'pedidos_excluidos' }, (payload) => {
          const newOrder = { ...payload.new, id: payload.new.order_id || payload.new.id };
          setOrders(current => {
            if (current.some(o => o.id === newOrder.id)) return current;
            return [newOrder, ...current];
          });
        })
        .subscribe();

      const channelFinance = supabase
        .channel('finance_realtime')
        .on('postgres_changes', { event: '*', table: 'finance' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setFinanceTransactions(current => {
              if (current.some(t => t.id === payload.new.id)) return current;
              return [payload.new, ...current];
            });
          } else if (payload.eventType === 'UPDATE') {
            setFinanceTransactions(current => current.map(t => t.id === payload.new.id ? payload.new : t));
          } else if (payload.eventType === 'DELETE') {
            setFinanceTransactions(current => current.filter(t => t.id !== payload.old.id));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channelPedidos);
        supabase.removeChannel(channelExcluidos);
        supabase.removeChannel(channelFinance);
      };
    }
  }, [isAuthenticated]);

  const fetchFinanceData = async () => {
    try {
      // Buscar Transações
      const { data: transData } = await supabase
        .from('finance')
        .select('*')
        .order('created_at', { ascending: false });
      if (transData) setFinanceTransactions(transData);

      // Buscar Categorias
      const { data: cats, error: catError } = await supabase
        .from('categorias')
        .select('*');
      
      if (cats && cats.length > 0) {
        setFinanceCategories(cats);
      } else if (!catError) {
        // Se a tabela existe mas está vazia, podemos subir os padrões
        const defaultCats = [
          { name: 'Suprimentos', color: '#3b82f6' },
          { name: 'Contas', color: '#ef4444' },
          { name: 'Funcionários', color: '#10b981' },
          { name: 'Manutenção', color: '#f59e0b' },
          { name: 'iFood', color: '#ea1d2c' }
        ];
        // Opcional: Auto-popular o banco na primeira vez
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
        category_id: newTrans.categoryId || null, // Tentando com o nome mais comum
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('finance')
        .insert([payload])
        .select();

      if (error) {
        // Se o erro for de coluna inexistente, damos o comando SQL exato
        if (error.message.includes("category_id")) {
          console.error("ERRO DE SCHEMA: A coluna 'category_id' não existe na tabela 'finance'.");
          alert("ERRO NO BANCO: Você precisa adicionar a coluna 'category_id' na sua tabela 'finance' no Supabase.\n\nExecute este comando no SQL Editor:\nALTER TABLE finance ADD COLUMN category_id uuid;");
          return;
        }
        throw error;
      }
      
      if (data) {
        setFinanceTransactions(current => {
          // Evitar duplicidade via Realtime (se data[0].id já existe, não adiciona)
          if (current.some(t => t.id === data[0].id)) return current;
          return [data[0], ...current];
        });
      }
    } catch (err) {
      console.error("Erro completo:", err);
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
    // 1. Verificar duplicidade localmente antes de enviar para o banco
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
        if (error.code === '23505') { // Erro de código único do Postgres
          alert("Esta categoria já existe no banco de dados!");
        } else {
          throw error;
        }
      }
    } catch (err) { 
      console.error("Erro ao salvar categoria:", err);
      alert("Erro ao salvar categoria no banco. Verifique sua conexão.");
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
            borderRight: '1px solid rgba(255,255,255,0.04)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Logo Section */}
          <div style={{ padding: '0 8px', marginBottom: '48px', display: 'flex', alignItems: 'center', justifyContent: isSidebarOpen ? 'space-between' : 'center' }}>
            <AnimatePresence mode="wait">
              {isSidebarOpen ? (
                <motion.div 
                  key="logo-full"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '8px', 
                    background: 'linear-gradient(135deg, #EC9424 0%, #d97706 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(236,148,36,0.2)'
                  }}>
                    <span style={{ fontWeight: 900, fontSize: '18px', color: 'white' }}>M</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', letterSpacing: '-0.3px', color: '#ffffff' }}>MELBURGERS</span>
                    <span style={{ fontSize: '10px', color: '#52525b', fontWeight: 600, letterSpacing: '0.5px' }}>ADMIN PANEL</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="logo-short"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  style={{ 
                    width: '32px', height: '32px', borderRadius: '8px', 
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: '14px', color: '#EC9424' }}>M</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#52525b', cursor: 'pointer', padding: '4px' }}
              >
                <ChevronLeft size={16} />
              </button>
            )}
          </div>

          {!isSidebarOpen && (
             <button 
               onClick={() => setIsSidebarOpen(true)}
               style={{ margin: '0 auto 32px', background: 'transparent', border: 'none', color: '#52525b', cursor: 'pointer' }}
             >
               <Menu size={20} />
             </button>
          )}

          {/* Navigation Items */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { id: 'orders', icon: LayoutDashboard, label: 'Operações' },
              { id: 'menu', icon: ShoppingBag, label: 'Cardápio' },
              { id: 'finance', icon: DollarSign, label: 'Inteligência Financeira' },
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}
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
                    transition: 'all 0.15s ease',
                    justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                    position: 'relative'
                  }}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeIndicator"
                      style={{ position: 'absolute', left: '-16px', width: '3px', height: '16px', background: '#EC9424', borderRadius: '0 4px 4px 0' }}
                    />
                  )}
                  <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} color={isActive ? '#EC9424' : 'currentColor'} />
                  {isSidebarOpen && <span style={{ fontWeight: isActive ? 500 : 400, fontSize: '13px' }}>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '24px' }}>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
              justifyContent: isSidebarOpen ? 'flex-start' : 'center'
            }}>
               <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#27272a', border: '1px solid #3f3f46', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 600 }}>WA</span>
               </div>
               {isSidebarOpen && (
                 <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>Willian Aragão</div>
                    <div style={{ fontSize: '10px', color: '#52525b' }}>Admin Local</div>
                 </div>
               )}
            </div>

            <button
              onClick={handleLogout}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: 'none',
                background: 'rgba(239, 68, 68, 0.05)',
                color: '#ef4444',
                cursor: 'pointer',
                justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                transition: 'all 0.2s',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              <LogOut size={16} />
              {isSidebarOpen && <span>Sair do Canal</span>}
            </button>
          </div>
        </motion.aside>
      )}

      {/* Main Content Area */}
      <main style={{ 
        flex: 1, 
        padding: isMobile ? '20px' : '40px 50px', 
        paddingBottom: isMobile ? '100px' : '40px',
        overflowY: (activeTab === 'orders' && !isMobile) ? 'hidden' : 'auto',
        height: isMobile ? 'auto' : '100vh',
        display: 'flex',
        flexDirection: 'column'
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
             onDeleteTransaction={handleDeleteTransaction}
             onUpdateTransaction={handleUpdateTransaction}
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
