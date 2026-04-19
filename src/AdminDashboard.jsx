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

const MoneyBagIcon = ({ size = 24, className, style, strokeWidth = 2 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    style={{ ...style, display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path d="M6 12a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5v-2Z" />
    <path d="M9 8V6a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v2" />
    <path d="M12 11v4" />
    <path d="M10 13h4" />
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
    console.log("🔍 Iniciando busca de pedidos...");
    
    try {
      setDbError(null);
      
      // Busca isolada para evitar que erro em uma tabela trave tudo
      const { data: activeData, error: activeError } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (activeError) {
        console.error("Erro na tabela pedidos:", activeError);
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
      console.log("✅ Busca concluída:", combined.length, "pedidos.");
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

            // 1. ESCUTA GLOBAL (Nuke Option - Qualquer mudança no schema public)
      const channel = supabase
        .channel('global-sync')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
          console.log("⚡ MUDANÇA GLOBAL DETECTADA:", payload.table, payload.eventType);
          fetchOrders();
        })
        .subscribe();

      // 2. POLLING DE ALTA FREQUÊNCIA (7 segundos)
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

  const MoneyBagIcon = ({ size = 24, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path d="M12,4c-1.1,0-2,.9-2,2c0,.37,.1,.71,.27,1c-1.39,.26-2.61,1.06-3.4,2.2c-1.1,1.6-1.1,3.8,0,5.4s3.3,2.4,5.13,2.4,4.03-.8,5.13-2.4s1.1-3.8,0-5.4c-.79-1.14-2.01-1.94-3.4-2.2c.17-.29,.27-.63,.27-1c0-1.1-.9-2-2-2Zm0,6c1.1,0,2,.9,2,2s-.9,2-2,2-2-.9-2-2,.9-2,2-2Zm0,1c-.55,0-1,.45-1,1s.45,1,1,1,1-.45,1-1-.45-1-1-1Zm-1,5v1h2v-1h.5c.28,0,.5-.22,.5-.5s-.22-.5-.5-.5h-1c-.28,0-.5-.22-.5-.5s.22-.5,.5-.5h.5v-1h.5v1h.5c.28,0,.5,.22,.5,.5s-.22-.5-.5-.5h-1c-.28,0-.5-.22-.5-.5s-.22-.5,.5-.5h2v-1h-2v1h-.5c-.28,0,.5,.22,.5,.5s-.22-.5,.5-.5h1c.28,0,.5,.22,.5,.5s-.22-.5-.5,.5h-.5v1h-.5Z" />
    <path d="M12,1c-.6,0-1.2,.2-1.7,.6c-.3,.2-.5,.5-.6,.9c-.2,.6,0,1.2,.4,1.6c.5,.4,1.1,.6,1.9,.6s1.4-.2,1.9-.6c.4-.4,.6-1,.4-1.6c-.1-.4-.3-.7-.6-.9c-.5-.4-1.1-.6-1.7-.6Z" opacity="0.3" />
  </svg>
);

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
      // Verificação mais resiliente (ignora horas e compara datas puras)
      const isSameDay = orderDate.toLocaleDateString() === today.toLocaleDateString();
      return isSameDay;
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
    const isToday = orderDate.toLocaleDateString() === today.toLocaleDateString();
    
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
          <header style={{ 
            marginBottom: isMobile ? '24px' : '40px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'center' : 'flex-end', 
            flexDirection: isMobile ? 'row' : 'row', 
            gap: '20px' 
          }}>
            <div>
              <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.5px', marginBottom: '4px' }}>
                {activeTab === 'orders' ? 'Operações' : 'Cardápio'}
              </h1>
              {isMobile ? (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px rgba(34,197,94,0.4)' }}></div>
                    <span style={{ fontSize: '11px', color: '#71717a' }}>Online • {lastSync.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                 </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#71717a', fontSize: '13px', fontWeight: 400 }}>
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })} • Workspace ativo
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isMobile && (
                <button 
                  onClick={() => {
                    const modes = ['list', 'grid', 'compact'];
                    const nextIndex = (modes.indexOf(viewMode) + 1) % modes.length;
                    setViewMode(modes[nextIndex]);
                  }}
                  style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#EC9424', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  {viewMode === 'list' && <LayoutList size={18} />}
                  {viewMode === 'grid' && <LayoutGrid size={18} />}
                  {viewMode === 'compact' && <Rows3 size={18} />}
                </button>
              )}
              {isMobile ? (
                <button 
                  onClick={playNotificationSound}
                  style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#EC9424', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Bell size={18} />
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => { localStorage.clear(); window.location.reload(); }}
                    style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#71717a', cursor: 'pointer', fontSize: '11px', fontWeight: 600, transition: 'all 0.2s' }}
                  >
                    Reiniciar
                  </button>
                  <button 
                    onClick={playNotificationSound}
                    style={{ padding: '8px 14px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, transition: 'all 0.2s' }}
                  >
                    <Bell size={14} />
                    Teste de som
                  </button>
                  <div style={{ padding: '8px 14px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px rgba(34,197,94,0.4)' }}></div>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>Sincronizado</span>
                     </div>
                     <span style={{ fontSize: '9px', color: '#71717a' }}>Atualizado às {lastSync.toLocaleTimeString()}</span>
                  </div>
                </>
              )}
            </div>
          </header>
        )}

        {activeTab === 'orders' && (
          <>
            <div style={{ 
              marginBottom: '30px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              flexDirection: isMobile ? 'column' : 'row', 
              gap: '15px' 
            }}>
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                overflowX: 'auto', 
                width: isMobile ? 'calc(100% + 40px)' : 'auto', 
                margin: isMobile ? '0 -20px' : '0', 
                padding: isMobile ? '4px 20px 12px' : '0', 
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch'
              }}>
                <button 
                  onClick={() => setDateFilter(dateFilter === 'today' ? 'all' : 'today')}
                  style={{ 
                    padding: isMobile ? '10px 18px' : '6px 14px', 
                    borderRadius: '12px', 
                    background: dateFilter === 'today' ? 'rgba(236, 148, 36, 0.15)' : 'rgba(255,255,255,0.03)', 
                    color: dateFilter === 'today' ? '#EC9424' : '#71717a', 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    border: dateFilter === 'today' ? '1px solid rgba(236,148,36,0.3)' : '1px solid rgba(255,255,255,0.04)', 
                    whiteSpace: 'nowrap', 
                    cursor: 'pointer', 
                    transition: 'all 0.2s' 
                  }}
                >
                  {dateFilter === 'today' ? 'Pedidos de Hoje' : 'Todos os Pedidos'}
                </button>
                <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.06)', margin: 'auto 8px', flexShrink: 0 }}></div>
                {[
                  { id: 'all', label: 'Fila Geral' },
                  { id: 'pending', label: 'Em Aberto' },
                  { id: 'concluded', label: 'Concluídos', color: '#2dd4bf' },
                  { id: 'deleted', label: 'Excluídos', color: '#f43f5e' }
                ].map((f) => (
                  <button 
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    style={{ 
                      padding: isMobile ? '10px 18px' : '6px 14px', 
                      borderRadius: '12px', 
                      background: statusFilter === f.id ? (f.color ? `${f.color}22` : 'rgba(255,255,255,0.08)') : 'rgba(255,255,255,0.03)', 
                      color: statusFilter === f.id ? (f.color || '#ffffff') : '#71717a', 
                      fontSize: '12px', 
                      fontWeight: 700, 
                      border: statusFilter === f.id ? `1px solid ${f.color || 'rgba(255,255,255,0.1)'}` : '1px solid rgba(255,255,255,0.04)', 
                      whiteSpace: 'nowrap', 
                      cursor: 'pointer', 
                      transition: 'all 0.2s' 
                    }}
                  >
                    {f.label}
                  </button>
                ))}
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

            <OrdersKanban orders={filteredOrders} updateStatus={updateStatus} handlePrint={handlePrint} statusFilter={statusFilter} viewMode={viewMode} />
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
                                style={{ width: isMobile ? '100%' : 'auto', padding: '12px 20px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                              >
                                {isMobile ? 'ESCOLHER FOTO' : 'SELECIONAR ARQUIVO'}
                              </button>
                              <div style={{ marginTop: '10px', color: '#64748b', fontSize: '11px', lineHeight: '1.4' }}>
                                {isMobile ? 'Toque na imagem ou no botão para trocar a foto.' : 'Clique na imagem ou no botão para subir uma foto do seu computador.'}
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
                            style={{ padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: '#0a0a0b', color: 'white', outline: 'none', fontSize: isMobile ? '16px' : '14px' }} 
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '1px' }}>PREÇO (R$)</span>
                          <input 
                            placeholder="0,00" 
                            type="number" 
                            value={editingItem.price} 
                            onChange={e => setEditingItem({...editingItem, price: e.target.value})} 
                            style={{ padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: '#0a0a0b', color: 'white', outline: 'none', fontSize: isMobile ? '16px' : '14px' }} 
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '1px' }}>DESCRIÇÃO DO PRODUTO</span>
                          <textarea 
                            placeholder="Ex: Pão brioche, blend 150g, queijo cheddar, alface e tomate" 
                            value={editingItem.description} 
                            onChange={e => setEditingItem({...editingItem, description: e.target.value})} 
                            style={{ padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: '#0a0a0b', color: 'white', outline: 'none', minHeight: '100px', resize: 'vertical', fontFamily: 'inherit', fontSize: isMobile ? '16px' : '14px' }} 
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

      {/* PlayStation-Inspired Premium Bottom Navigation (FIXED DOCK VERSION) */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          zIndex: 5000,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <motion.nav 
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{
              width: '100%',
              height: '115px',
              position: 'relative',
              background: 'none',
              border: 'none',
              boxShadow: 'none',
              zIndex: 1000,
              pointerEvents: 'none'
            }}
          >
            <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'auto' }}>
            <svg
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '166%',
                zIndex: 1,
                transform: 'translateY(-66px)'
              }}
              viewBox="0 0 390 115"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="shellFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(15,15,18,0.99)" /> 
                  <stop offset="55%" stopColor="rgba(10,10,12,0.99)" />
                  <stop offset="100%" stopColor="rgba(5,5,7,1)" />
                </linearGradient>
                <linearGradient id="strokeGlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.02)" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
                </linearGradient>
              </defs>

              {/* PREENCHIMENTO DA CÁPSULA (Onyx com Transparência Leve + Blur) */}
              <path
                d="M0,72 C100,64 150,62 195,62 C240,62 290,64 390,72 L390,104 C290,96 240,94 195,94 C150,94 100,96 0,104 Z"
                fill="rgba(5, 5, 7, 0.94)"
                style={{ backdropFilter: 'blur(8px)' }}
              />

              {/* RODAPÉ DO MENU (Abaixo da Luz - Cinza Chumbo) */}
              <path
                d="M0,102 C100,94 150,92 195,92 C240,92 290,94 390,102 V115 H0 Z"
                fill="#121215"
              />

              {/* Linha do Horizonte Inferior (TRANSPARENTE) */}
              <path
                d="M0,102 C100,94 150,92 195,92 C240,92 290,94 390,102"
                fill="none"
                stroke="none"
              />
              
              {/* Segmento de Luz Branca com Super Aura Azul */}
              <motion.path
                d="M0,102 C100,94 150,92 195,92 C240,92 290,94 390,102"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ 
                  filter: 'drop-shadow(0 0 8px #00f3ff) drop-shadow(0 0 16px rgba(0,243,255,0.6))'
                }}
                initial={false}
                animate={{
                  strokeDasharray: "44 350",
                  strokeDashoffset: `${[
                    -26,   // Pedidos (Refinado)
                    -99,   // Cardápio (Refinado)
                    -173,  // Busca (Centro Exato)
                    -246,  // Financeiro (Refinado)
                    -320   // Histórico (Refinado)
                  ][['orders', 'menu', 'search', 'finance', 'orders-history'].indexOf(activeTab)]}px`
                }}
                transition={{ type: "spring", stiffness: 220, damping: 26 }}
              />
            </svg>

            {/* ARCO SUPERIOR (Viseira - Recalibrado para 115px) */}
            <svg
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '191%',
                zIndex: 20, 
                pointerEvents: 'none'
              }}
              viewBox="0 0 390 115"
              preserveAspectRatio="none"
            >
              {/* Apenas a Linha do Arco (Sem Preenchimento) */}
              <path
                d="M0,28 C100,20 150,18 195,18 C240,18 290,20 390,28"
                fill="none"
                stroke="none"
              />
            </svg>

            {/* Halo de Seleção */}
            <motion.div
              style={{
                position: 'absolute',
                top: '25px',
                width: '110px',
                height: '60px',
                marginLeft: '-55px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(160,200,255,0.22), rgba(160,200,255,0.04) 50%, transparent 72%)',
                filter: 'blur(15px)',
                zIndex: 2,
                pointerEvents: 'none'
              }}
              animate={{ left: (['orders', 'menu', 'search', 'finance', 'orders-history'].indexOf(activeTab) * 20 + 10) + '%' }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            />



            {/* Container de Ícones (Centralizado entre os arcos) */}
            <div style={{
              position: 'absolute',
              top: '42px', // Descido de 35px para 42px para centralizar melhor
              left: 0,
              right: 0,
              padding: '0 24px',
              zIndex: 5
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <LayoutGroup>
                  {[
                    { id: 'orders-history', icon: ClipboardList, offset: 8 },
                    { id: 'menu', icon: ShoppingBag, offset: 0 },
                    { id: 'search', icon: Search, offset: -12 },
                    { id: 'finance', icon: MoneyBagIcon, offset: 0 },
                    { id: 'orders', icon: Home, offset: 8 }
                  ].map((item, index) => {
                    const isActive = activeTab === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                        }}
                        style={{
                          width: '48px',
                          background: 'none',
                          border: 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          position: 'relative',
                          cursor: 'pointer',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                        animate={{ y: item.offset }}
                        transition={{ type: "spring", stiffness: 320, damping: 22 }}
                      >
                        <motion.div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                          }}
                          animate={{
                            scale: 1,
                            opacity: isActive ? 1 : 0.75
                          }}
                        >

                          <item.icon 
                            size={24} 
                            color="#ffffff"
                            strokeWidth={isActive ? 2.5 : 1.8}
                            style={{ 
                              position: 'relative', 
                              zIndex: 2,
                              transform: item.id === 'search' 
                                ? 'translateY(7px)' 
                                : 'none'
                            }}
                          />
                        </motion.div>
                      </motion.button>
                    );
                  })}
                </LayoutGroup>
              </div>
            </div>

            {/* Texto de Identificação (Abaixo da Linha do Arco) */}
            <div style={{
              position: 'absolute',
              bottom: '5px',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              zIndex: 10
            }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#ffffff',
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase'
                  }}
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
