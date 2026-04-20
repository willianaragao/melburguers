import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, Printer, Bell, CheckCircle, Clock, 
  RefreshCcw, ChevronRight, LayoutDashboard, Settings, Edit, Plus, Trash2, Save, X, Image as ImageIcon,
  DollarSign, ArrowUpCircle, ArrowDownCircle, TrendingUp, LogOut, Menu, ChevronLeft, MapPin, MessageSquare,
  LayoutList, LayoutGrid, Rows3, Search, Home, ClipboardList, ChevronDown
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

const MenuIcon = ({ size = 30, className, style, isActive }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 64 64" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{
      ...style,
      filter: isActive ? 'drop-shadow(0 0 8px rgba(0,243,255,0.8))' : 'opacity(0.6)',
      transition: 'all 0.3s ease'
    }}
  >
    {/* Batata ao fundo */}
    <path
      d="M40 16H54L52.2 43C52.1 44.7 50.7 46 49 46H45C43.3 46 41.9 44.7 41.8 43L40 16Z"
      fill={isActive ? "#00f3ff" : "white"}
    />
    <path d="M41.5 16L40.8 9.5C40.7 8.8 41.3 8.2 42 8.4L45 9.4V16H41.5Z" fill={isActive ? "#00f3ff" : "white"}/>
    <path d="M46 16V7.5C46 6.9 46.7 6.5 47.2 6.9L49 8.2V16H46Z" fill={isActive ? "#00f3ff" : "white"}/>
    <path d="M50 16L50.8 8.8C50.9 8.1 51.7 7.8 52.2 8.3L54 10V16H50Z" fill={isActive ? "#00f3ff" : "white"}/>

    {/* Burger */}
    <path
      d="M10 26C10 18.8 16.8 14 25 14C33.2 14 40 18.8 40 26V27H10V26Z"
      fill={isActive ? "#00f3ff" : "white"}
    />
    {/* sementes */}
    <ellipse cx="19" cy="19.5" rx="1.1" ry="0.7" fill="#050506"/>
    <ellipse cx="24.5" cy="17.8" rx="1.1" ry="0.7" fill="#050506"/>
    <ellipse cx="30" cy="19.5" rx="1.1" ry="0.7" fill="#050506"/>

    {/* recheio 1 */}
    <rect x="11.5" y="29" width="27" height="2.8" rx="1.4" fill={isActive ? "#00f3ff" : "white"}/>
    {/* queijo escorrendo */}
    <path
      d="M13 32H37C37.6 32 38 32.4 38 33V34.4C38 35 37.6 35.4 37 35.4 C35.6 35.4 35 36 35 37.2C35 38.8 33.9 40 32.3 40C30.7 40 29.6 38.8 29.6 37.2 C29.6 36 28.9 35.4 27.8 35.4C26.7 35.4 26 36 26 37.2C26 38.8 24.9 40 23.3 40 C21.7 40 20.6 38.8 20.6 37.2C20.6 36 19.9 35.4 18.8 35.4C17.7 35.4 17 36 17 37.2 C17 38.8 15.9 40 14.3 40C12.7 40 11.6 38.8 11.6 37.2V33.4C11.6 32.6 12.2 32 13 32Z"
      fill={isActive ? "#00f3ff" : "white"}
    />
    {/* recheio 2 */}
    <rect x="12" y="37.5" width="26" height="2.6" rx="1.3" fill={isActive ? "#00f3ff" : "white"}/>
    {/* pão inferior */}
    <rect x="10" y="42" width="30" height="7" rx="3.5" fill={isActive ? "#00f3ff" : "white"}/>
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

const SearchIcon = ({ size = 24, className, style, isActive }) => (
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
    <g 
      stroke={isActive ? "#00f3ff" : "white"} 
      strokeWidth={isActive ? "2.5" : "2.2"} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="10.5" cy="10.5" r="5.5"/>
      <path d="M15 15L20 20"/>
    </g>
  </svg>
);

const SettingsIcon = ({ size = 24, className, style, isActive }) => (
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
    <g 
      stroke={isActive ? "#00f3ff" : "white"} 
      strokeWidth={isActive ? "2.2" : "1.8"} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 3 L13.2 3.4 L14 5.2 L16 5.8 L17.8 4.8 L19.2 6.2 L18.2 8 L18.8 10 L20.6 10.8 L21 12 L20.6 13.2 L18.8 14 L18.2 16 L19.2 17.8 L17.8 19.2 L16 18.2 L14 18.8 L13.2 20.6 L12 21 L10.8 20.6 L10 18.8 L8 18.2 L6.2 19.2 L4.8 17.8 L5.8 16 L5.2 14 L3.4 13.2 L3 12 L3.4 10.8 L5.2 10 L5.8 8 L4.8 6.2 L6.2 4.8 L8 5.8 L10 5.2 L10.8 3.4 Z" />
      <circle cx="12" cy="12" r="3.2"/>
    </g>
  </svg>
);

const SaveSettingsButton = ({ appSettings, viewMode, isAutoPrint }) => {
  const [saved, setSaved] = React.useState(false);

  const handleSave = () => {
    const toSave = { ...appSettings, defaultViewMode: viewMode, autoPrint: isAutoPrint };
    localStorage.setItem('melburguers_settings', JSON.stringify(toSave));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <button
      onClick={handleSave}
      style={{
        width: '100%', padding: '16px',
        borderRadius: '16px',
        background: saved ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
        color: saved ? '#22c55e' : 'rgba(255,255,255,0.8)',
        border: saved ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.08)',
        fontWeight: 800, fontSize: '13px', cursor: 'pointer',
        letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        transition: 'all 0.4s ease',
        boxShadow: saved ? '0 0 20px rgba(34,197,94,0.1)' : 'none'
      }}
    >
      {saved ? <CheckCircle size={16} /> : <Save size={16} />}
      {saved ? 'CONFIGURAÇÕES SALVAS!' : 'SALVAR CONFIGURAÇÕES'}
    </button>
  );
};

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('orders-history'); 
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [dateFilter, setDateFilter] = useState('today'); // 'today', 'all'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // System Settings State
  const [appSettings, setAppSettings] = useState(() => {
    const saved = localStorage.getItem('melburguers_settings');
    return saved ? JSON.parse(saved) : {
      defaultViewMode: 'grid',
      notificationSound: '/sonido-shopify.mp3',
      autoPrint: false,
      compactCards: false
    };
  });

  const [orders, setOrders] = useState([]);
  const [dbError, setDbError] = useState(null);
  const [lastSync, setLastSync] = useState(new Date());
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPrinterReady, setIsPrinterReady] = useState(false);
  const [isAutoPrint, setIsAutoPrint] = useState(appSettings.autoPrint);
  const printerRef = useRef(null);
  const lastOrderId = useRef(null);
  
  // Finance State
  const [financeTransactions, setFinanceTransactions] = useState([]);
  const [financeCategories, setFinanceCategories] = useState([]);
  const [viewMode, setViewMode] = useState(appSettings.defaultViewMode);
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

  const playBellSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const frequencies = [880, 1108, 1320];
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 1.2);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 1.2);
      });
    } catch(e) { console.log('Bell sound error:', e); }
  };

  const playDigitalProSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [
        { freq: 523, t: 0,    dur: 0.12 },
        { freq: 659, t: 0.13, dur: 0.12 },
        { freq: 784, t: 0.26, dur: 0.25 },
      ];
      notes.forEach(({ freq, t, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + t);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + dur);
      });
    } catch(e) { console.log('Digital sound error:', e); }
  };

  const playNotificationSound = () => {
    try {
      if (appSettings.notificationSound === '/images/bell.mp3') {
        playBellSound();
      } else if (appSettings.notificationSound === '/images/digital.mp3') {
        playDigitalProSound();
      } else {
        // Shopify Classic — novo arquivo
        const audio = new Audio('/sonido-shopify.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
        setTimeout(() => { audio.pause(); audio.currentTime = 0; }, 1500);
      }
    } catch (err) {
      console.error("Erro ao tocar som:", err);
    }
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
    setAppSettings(prev => ({ ...prev, autoPrint: isAutoPrint, defaultViewMode: viewMode }));
  }, [isAutoPrint, viewMode]);

  useEffect(() => {
    localStorage.setItem('melburguers_settings', JSON.stringify(appSettings));
  }, [appSettings]);

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

  const [isTrashMenuOpen, setIsTrashMenuOpen] = useState(false);

  const handleClearDeletedOrders = async () => {
    const trashedOrders = (orders || []).filter(o => o.status === 'excluido');
    
    if (trashedOrders.length === 0) {
      alert("A lixeira já está vazia.");
      setIsTrashMenuOpen(false);
      return;
    }

    if (!window.confirm(`Deseja excluir PERMANENTEMENTE os ${trashedOrders.length} pedidos da lixeira? Esta ação não pode ser desfeita.`)) return;
    
    try {
      // Coleta os IDs reais do banco de dados para garantir a exclusão
      const trashedIds = trashedOrders.map(o => o.original_db_id);

      const { error } = await supabase
        .from('pedidos_excluidos')
        .delete()
        .in('id', trashedIds);
      
      if (error) throw error;
      
      setOrders(prev => prev.filter(o => o.status !== 'excluido'));
      setIsTrashMenuOpen(false);
      alert("Lixeira esvaziada com sucesso!");
    } catch (err) {
      console.error("Erro ao limpar lixeira:", err);
      alert(`Erro ao limpar lixeira: ${err.message || 'Erro desconhecido'}`);
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

  const filteredOrders = (orders || []).filter(order => {
    if (!order) return false;
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
              { id: 'orders-history', renderIcon: (isActive) => <HistoryIcon size={20} isActive={isActive} />, label: 'Pedidos' },
              { id: 'menu', renderIcon: (isActive) => <MenuIcon size={20} isActive={isActive} />, label: 'Cardápio' },
              { id: 'finance', renderIcon: (isActive) => <MoneyBagIcon size={20} isActive={isActive} />, label: 'Financeiro' },
              { id: 'orders', renderIcon: (isActive) => <SettingsIcon size={20} isActive={isActive} />, label: 'Ajustes' },
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
                  {item.renderIcon(isActive)}
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
        {activeTab !== 'finance' && activeTab !== 'orders' && (
          <header style={{ marginBottom: isMobile ? '24px' : '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 700, color: '#f8fafc' }}>
                {activeTab === 'menu' ? 'Cardápio' : activeTab === 'search' ? 'Explorar' : 'Pedidos'}
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

        {(activeTab === 'orders-history' || activeTab === 'search') && (
          <>
            <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isMobile ? 'column' : 'row', gap: '15px' }}>
              <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', width: isMobile ? '100%' : 'auto', paddingBottom: '4px' }}>
                <button 
                  onClick={() => setDateFilter(dateFilter === 'today' ? 'all' : 'today')}
                  style={{ padding: '8px 16px', borderRadius: '12px', background: dateFilter === 'today' ? 'rgba(236,148,36,0.1)' : 'rgba(255,255,255,0.03)', color: dateFilter === 'today' ? '#EC9424' : '#71717a', border: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }}
                >
                  {dateFilter === 'today' ? 'Hoje' : 'Sempre'}
                </button>
                {['all', 'pending', 'concluded', 'deleted'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      onClick={() => {
                        setStatusFilter(f);
                        if (f !== 'deleted') setIsTrashMenuOpen(false);
                      }}
                      style={{ 
                        padding: '8px 16px', 
                        borderRadius: '12px', 
                        background: statusFilter === f ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', 
                        color: statusFilter === f ? 'white' : '#71717a', 
                        border: '1px solid rgba(255,255,255,0.05)', 
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      {f === 'all' ? 'Geral' : f === 'pending' ? 'Abertos' : f === 'concluded' ? 'Finais' : 'Lixo'}
                      {f === 'deleted' && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsTrashMenuOpen(!isTrashMenuOpen);
                          }}
                          style={{ 
                            padding: '4px', 
                            marginLeft: '4px', 
                            borderRadius: '6px', 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isTrashMenuOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
                            transition: 'all 0.2s'
                          }}
                        >
                          <ChevronDown size={14} style={{ transform: isTrashMenuOpen ? 'rotate(-90deg)' : 'none', transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        </div>
                      )}
                    </button>

                    {f === 'deleted' && (
                      <AnimatePresence>
                        {isTrashMenuOpen && (
                          <motion.button
                            initial={{ width: 0, opacity: 0, x: -15, scale: 0.9 }}
                            animate={{ width: 'auto', opacity: 1, x: 0, scale: 1 }}
                            exit={{ width: 0, opacity: 0, x: -10, scale: 0.9 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            onClick={handleClearDeletedOrders}
                            style={{ 
                              padding: '8px 16px', 
                              background: 'rgba(255,255,255,0.03)', 
                              border: '1px solid rgba(255,255,255,0.05)', 
                              borderRadius: '12px', 
                              color: '#ef4444', 
                              fontSize: '13px', 
                              fontWeight: 600, 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden'
                            }}
                          >
                            <Trash2 size={14} />
                            LIMPAR TUDO
                          </motion.button>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={handlePrinterConnect} style={{ padding: '8px 16px', borderRadius: '12px', background: isPrinterReady ? 'rgba(34,197,94,0.1)' : 'transparent', color: isPrinterReady ? '#22c55e' : '#71717a', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={14} /> {isPrinterReady ? 'Pronto' : 'Imprimir'}
              </button>
            </div>
            <OrdersKanban orders={filteredOrders} updateStatus={updateStatus} handlePrint={handlePrint} statusFilter={statusFilter} viewMode={viewMode} />
          </>
        )}

        {activeTab === 'search' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', height: isMobile ? 'calc(100vh - 180px)' : 'calc(100vh - 80px)', gap: '0' }}
          >
            {/* Barra de endereço premium */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: '#111113', borderRadius: '16px 16px 0 0',
              padding: '10px 16px',
              border: '1px solid rgba(255,255,255,0.06)',
              borderBottom: 'none'
            }}>
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                background: '#0a0a0b', borderRadius: '10px', padding: '8px 14px',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', letterSpacing: '0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {window.location.origin}/
                </span>
              </div>
              <button
                onClick={() => window.open(window.location.origin + '/', '_blank')}
                title="Abrir em nova aba"
                style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </button>
            </div>

            {/* iFrame do cardápio digital */}
            <iframe
              src={window.location.origin + '/'}
              title="Cardápio Digital"
              style={{
                flex: 1, width: '100%', border: 'none',
                borderRadius: '0 0 16px 16px',
                background: '#0a0a0b',
                outline: 'none',
                display: 'block'
              }}
            />
          </motion.div>
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

        {activeTab === 'orders' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ maxWidth: '760px', margin: '0 auto' }}
          >
            {/* Header */}
            <div style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <SettingsIcon size={20} isActive={true} />
                </div>
                <div>
                  <h1 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 900, color: 'white', margin: 0 }}>Ajustes do Sistema</h1>
                  <p style={{ color: '#52525b', fontSize: '13px', margin: 0, marginTop: '2px' }}>Preferências globais do painel melburguers</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Card: Interface */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                style={{
                  background: 'linear-gradient(145deg, #111113 0%, #0d0d0f 100%)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  overflow: 'hidden'
                }}
              >
                {/* Section header */}
                <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LayoutGrid size={14} color="rgba(255,255,255,0.6)" />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Interface</span>
                </div>

                {/* Row */}
                <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: '16px' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#f4f4f5', fontSize: '14px' }}>Visualização Padrão</div>
                    <div style={{ fontSize: '12px', color: '#52525b', marginTop: '3px' }}>Como os pedidos aparecem ao iniciar</div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', background: '#0a0a0b', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', width: isMobile ? '100%' : 'auto' }}>
                    {[
                      { id: 'grid', label: 'Grade', icon: <LayoutGrid size={12} /> },
                      { id: 'list', label: 'Lista', icon: <LayoutList size={12} /> },
                      { id: 'compact', label: 'Card', icon: <Rows3 size={12} /> },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setViewMode(m.id)}
                        style={{
                          flex: 1, padding: '9px 14px', borderRadius: '7px',
                          background: viewMode === m.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                          color: viewMode === m.id ? '#f0f0f0' : '#52525b',
                          border: viewMode === m.id ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
                          fontSize: '11px', fontWeight: 800, cursor: 'pointer',
                          transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center',
                          boxShadow: viewMode === m.id ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
                        }}
                      >
                        {m.icon}{m.label.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Card: Notificações */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  background: 'linear-gradient(145deg, #111113 0%, #0d0d0f 100%)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bell size={14} color="rgba(255,255,255,0.6)" />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Notificações</span>
                </div>

                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: '14px' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#f4f4f5', fontSize: '14px' }}>Som de Novo Pedido</div>
                      <div style={{ fontSize: '12px', color: '#52525b', marginTop: '3px' }}>Alerta ao receber um pedido</div>
                    </div>
                    <select
                      value={appSettings.notificationSound}
                      onChange={(e) => setAppSettings(prev => ({ ...prev, notificationSound: e.target.value }))}
                      style={{
                        width: isMobile ? '100%' : '190px', padding: '10px 14px',
                        borderRadius: '10px', background: '#0a0a0b', color: '#f4f4f5',
                        border: '1px solid rgba(255,255,255,0.08)', fontSize: '13px', outline: 'none', cursor: 'pointer'
                      }}
                    >
                      <option value="/sonido-shopify.mp3">Shopify Classic</option>
                      <option value="/images/bell.mp3">Bell (Sino)</option>
                      <option value="/images/digital.mp3">Digital Pro</option>
                    </select>
                  </div>

                  {/* Test button */}
                  <button
                    onClick={playNotificationSound}
                    style={{
                      width: '100%', padding: '13px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      fontWeight: 800, fontSize: '12px', cursor: 'pointer',
                      letterSpacing: '1.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  >
                    <Bell size={14} /> TESTAR TOQUE ATUAL
                  </button>
                </div>
              </motion.div>

              {/* Card: Hardware */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{
                  background: 'linear-gradient(145deg, #111113 0%, #0d0d0f 100%)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Printer size={14} color="rgba(255,255,255,0.6)" />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Hardware & Impressão</span>
                </div>

                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Auto print toggle row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#f4f4f5', fontSize: '14px' }}>Impressão Automática</div>
                      <div style={{ fontSize: '12px', color: '#52525b', marginTop: '3px' }}>Imprimir cupom ao receber pedido</div>
                    </div>
                    <button
                      onClick={() => setIsAutoPrint(!isAutoPrint)}
                      style={{
                        width: '52px', height: '28px', borderRadius: '20px',
                        background: isAutoPrint ? '#22c55e' : '#27272a',
                        position: 'relative', border: 'none', cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: isAutoPrint ? '0 0 12px rgba(34,197,94,0.35)' : 'none',
                        flexShrink: 0
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: '3px',
                        left: isAutoPrint ? '27px' : '3px',
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: 'white',
                        transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
                      }} />
                    </button>
                  </div>

                  {/* Printer status row */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px 18px', background: '#0a0a0b',
                    borderRadius: '14px', border: `1px solid ${isPrinterReady ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '11px',
                        background: isPrinterReady ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${isPrinterReady ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)'}`
                      }}>
                        <Printer size={18} color={isPrinterReady ? '#22c55e' : '#52525b'} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#f4f4f5' }}>Impressora Térmica</div>
                        <div style={{ fontSize: '11px', fontWeight: 800, marginTop: '2px', letterSpacing: '0.5px', color: isPrinterReady ? '#22c55e' : '#ef4444' }}>
                          {isPrinterReady ? '● CONECTADA' : '● DESCONECTADA'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handlePrinterConnect}
                      style={{
                        padding: '9px 18px', borderRadius: '10px',
                        background: isPrinterReady ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)',
                        color: isPrinterReady ? '#71717a' : '#f0f0f0',
                        border: isPrinterReady ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.15)',
                        fontSize: '11px', fontWeight: 900, cursor: 'pointer',
                        transition: 'all 0.2s', letterSpacing: '0.5px',
                        boxShadow: 'none'
                      }}
                    >
                      {isPrinterReady ? 'ALTERAR' : 'PAREAR'}
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Save Button */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <SaveSettingsButton
                  appSettings={appSettings}
                  viewMode={viewMode}
                  isAutoPrint={isAutoPrint}
                />
              </motion.div>

            </div>
          </motion.div>
        )}

      </main>

      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 5000 }}>
          <motion.nav style={{ height: '115px', position: 'relative' }}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '166%', transform: 'translateY(-66px)', overflow: 'visible' }} viewBox="0 0 390 115" preserveAspectRatio="none">
                <defs>
                  <filter id="neonGlow" x="-100%" y="-400%" width="300%" height="900%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0  0.8 1 1 0 0  0.8 1 1 0 0  0 0 0 1.5 0" in="blur" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* 1. Arco preto — fundo */}
                <path d="M0,102 C100,94 150,92 195,92 C240,92 290,94 390,102 V115 H0 Z" fill="#121215" />

                {/* 2. Arco cinza — meio */}
                <path d="M0,72 C100,64 150,62 195,62 C240,62 290,64 390,72 L390,104 C290,96 240,94 195,94 C150,94 100,96 0,104 Z" fill="rgba(5, 5, 7, 0.97)" />

                {/* 3. Barra neon — na frente de tudo */}
                <motion.path
                  d="M0,102 C100,94 150,92 195,92 C240,92 290,94 390,102"
                  fill="none"
                  stroke="#00f3ff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  filter="url(#neonGlow)"
                  animate={{
                    strokeDasharray: "44 350",
                    strokeDashoffset: `${[-26, -99, -173, -246, -320][['orders-history', 'menu', 'search', 'finance', 'orders'].indexOf(activeTab)]}px`
                  }}
                  transition={{ type: "spring", stiffness: 220, damping: 26 }}
                />
              </svg>

              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '191%', zIndex: 20, pointerEvents: 'none' }} viewBox="0 0 390 115" preserveAspectRatio="none">
                <path d="M0,28 C100,20 150,18 195,18 C240,18 290,20 390,28" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
              </svg>


              <div style={{ position: 'absolute', top: '42px', left: 0, right: 0, padding: '0 24px', zIndex: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <LayoutGroup>
                    {[
                      { id: 'orders-history', icon: HistoryIcon, size: 24, offset: 8 },
                      { id: 'menu', icon: MenuIcon, size: 30, offset: 0 },
                      { id: 'search', icon: SearchIcon, size: 24, offset: -12 },
                      { id: 'finance', icon: MoneyBagIcon, size: 24, offset: 0 },
                      { id: 'orders', icon: SettingsIcon, size: 24, offset: 8 }
                    ].map((item) => {
                      const isActive = activeTab === item.id;
                      return (
                        <motion.button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          style={{ width: '48px', background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                          animate={{ y: item.offset }}
                        >
                          <motion.div style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} animate={{ opacity: isActive ? 1 : 0.6 }}>
                            <item.icon size={item.size} isActive={isActive} color="#ffffff" style={{ transform: item.id === 'search' ? 'translateY(7px)' : item.id === 'orders' ? 'translate(4px, 4px)' : item.id === 'orders-history' ? 'translate(-3px, 4px)' : item.id === 'menu' ? 'translateY(2px)' : 'none' }} />
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
                    {activeTab === 'orders-history' ? 'Pedidos' : activeTab === 'menu' ? 'Cardápio' : activeTab === 'search' ? 'Explorar' : activeTab === 'finance' ? 'Financeiro' : 'Ajustes'}
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
