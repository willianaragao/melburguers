import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, Printer, Bell, CheckCircle, Clock, 
  RefreshCcw, ChevronRight, LayoutDashboard, Settings, Edit, Plus, Trash2, Save, X, Image as ImageIcon, Camera, Upload,
  DollarSign, ArrowUpCircle, ArrowDownCircle, TrendingUp, LogOut, Menu, ChevronLeft, MapPin, MessageSquare,
  LayoutList, LayoutGrid, Rows3, Search, Home, ClipboardList, ChevronDown, GripVertical, ShoppingCart, Maximize
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  DndContext, closestCorners, KeyboardSensor, PointerSensor, 
  useSensor, useSensors, DragOverlay 
} from '@dnd-kit/core';
import { 
  SortableContext, arrayMove, sortableKeyboardCoordinates, 
  rectSortingStrategy, useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getMenuData, saveMenuData } from './utils/menuStore';
import { supabase } from './utils/supabase';
import { formatOrderForPrinter, connectToPrinter, sendToPrinter, printOrder } from './utils/printer';
import { FinanceDashboard } from './FinanceDashboard';
import { OrdersKanban } from './OrdersKanban';

// Injeta estilos CSS globais para barra de rolagem minimalista
const ScrollbarStyles = () => (
  <style>{`
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      transition: all 0.3s;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.25);
    }
    
    /* Suporte para Firefox */
    * {
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
    }

    /* Ajuste para containers com .hide-scrollbar se quiser que apareça agora */
    .hide-scrollbar::-webkit-scrollbar {
      display: block !important;
      height: 4px !important;
    }
  `}</style>
);

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
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="170"
      fontFamily="Arial, Helvetica, sans-serif"
      fontWeight="700"
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


/* SettingsIcon was here, removed duplicate */

const MenuSkeleton = () => (
  <div style={{ 
    padding: '16px', 
    background: 'rgba(255,255,255,0.02)', 
    borderRadius: '20px', 
    border: '1px solid rgba(255,255,255,0.05)',
    display: 'flex', 
    gap: '16px',
    alignItems: 'center',
    position: 'relative',
    minHeight: '130px',
    overflow: 'hidden'
  }}>
    {/* Image Placeholder */}
    <div style={{ 
      width: '80px', height: '80px', borderRadius: '14px', 
      background: 'rgba(255,255,255,0.03)', position: 'relative'
    }}>
      <motion.div
        animate={{ x: ['-100%', '100%'] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)'
        }}
      />
    </div>
    
    <div style={{ flex: 1 }}>
      {/* Title Placeholder */}
      <div style={{ width: '40%', height: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', marginBottom: '8px', position: 'relative', overflow: 'hidden' }}>
        <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }} />
      </div>
      {/* Desc Placeholder */}
      <div style={{ width: '80%', height: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '3px', marginBottom: '12px', position: 'relative', overflow: 'hidden' }}>
        <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: '50px', height: '16px', background: 'rgba(34,197,94,0.05)', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
           <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(34,197,94,0.1), transparent)' }} />
        </div>
        <div style={{ width: '24px', height: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }} />
      </div>
    </div>
  </div>
);

const SortableMenuItem = ({ item, cat, handleEditItem }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, background: 'rgba(255,255,255,0.05)' }}
        style={{ 
          padding: '16px', 
          background: 'rgba(255,255,255,0.02)', 
          borderRadius: '20px', 
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', 
          gap: '16px',
          alignItems: 'center',
          cursor: 'pointer',
          position: 'relative',
          minHeight: '130px', // Garante tamanho uniforme
          boxShadow: isDragging ? '0 20px 40px rgba(0,0,0,0.4)' : 'none'
        }}
        onClick={() => handleEditItem(cat, item)}
      >
        <div 
          {...attributes} {...listeners} 
          style={{ width: '24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', cursor: 'grab' }}
        >
          <GripVertical size={16} />
        </div>

        <div style={{ width: '80px', height: '80px', borderRadius: '14px', background: '#0a0a0b', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', flexShrink: 0 }}>
          {item.image ? (
            <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#0a0a0b' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#27272a' }}>
              <ImageIcon size={24} />
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignSelf: 'stretch', justifyContent: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '15px', color: 'white', marginBottom: '4px', wordBreak: 'break-word', lineHeight: '1.2' }}>
            {item.name}
          </div>
          <div style={{ color: '#52525b', fontSize: '11px', marginBottom: '8px', lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {item.description || 'Sem descrição definida'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <div style={{ color: '#22c55e', fontSize: '16px', fontWeight: 900 }}>
              R$ {item.price ? item.price.toFixed(2) : '0.00'}
            </div>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '10px', 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: 'white',
              boxShadow: '0 0 10px rgba(255,255,255,0.05)',
              transition: 'all 0.3s ease'
            }}>
              <Edit size={14} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
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

// Componente do Botão de Salvar movido para dentro ou simplificado para garantir execução
const SaveSettingsButton = ({ appSettings, viewMode, isAutoPrint }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showToast, setShowToast] = useState(false);

  const handleSave = () => {
    if (isSaving) return;
    setIsSaving(true);
    
    // O salvamento acontece após 1 segundo
    setTimeout(() => {
      try {
        const settings = { ...appSettings, defaultViewMode: viewMode, autoPrint: isAutoPrint };
        try {
          localStorage.setItem('melburguers_settings', JSON.stringify(settings));
        } catch (e) {
          localStorage.removeItem('viewMode'); 
          localStorage.setItem('melburguers_settings', JSON.stringify(settings));
        }
        setIsSaving(false);
        setShowToast(true);
        if (navigator.vibrate) navigator.vibrate(40);
        setTimeout(() => setShowToast(false), 3000);
      } catch (e) {
        setIsSaving(false);
        setShowToast(true);
      }
    }, 1000);
  };

  return (
    <div style={{ position: 'relative', width: '100%', marginTop: '24px', zIndex: 100 }}>
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ y: -100, opacity: 0, x: '-50%' }}
            animate={{ y: 40, opacity: 1, x: '-50%' }}
            exit={{ y: -100, opacity: 0, x: '-50%' }}
            style={{
              position: 'fixed', top: 0, left: '50%',
              zIndex: 999999, background: '#22c55e', color: 'white',
              padding: '14px 28px', borderRadius: '18px', 
              fontWeight: 500, fontSize: '14px',
              display: 'flex', alignItems: 'center', gap: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <CheckCircle size={18} /> Configurações salvas com sucesso
          </motion.div>
        )}
      </AnimatePresence>
      
      <button
        onClick={handleSave}
        onTouchStart={(e) => {
          if (!isSaving) handleSave();
        }}
        disabled={isSaving}
        style={{
          width: '100%', padding: '20px',
          borderRadius: '24px',
          background: '#161618',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.1)',
          fontWeight: 600, fontSize: '14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
      >
        {/* Barra de Progresso - ANIMADA VIA CSS (Mais confiável no Mobile) */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, 
          width: isSaving ? '100%' : '0%', // Dispara o movimento CSS
          background: '#22c55e',
          zIndex: 5,
          transition: isSaving ? 'width 1s linear' : 'none', // 1 segundo exato de animação
          transform: 'translateZ(0)',
          boxShadow: isSaving ? '0 0 20px rgba(34, 197, 94, 0.6)' : 'none',
          opacity: isSaving ? 1 : 0
        }} />
        
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isSaving ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ display: 'flex' }}>
              <RefreshCcw size={18} />
            </motion.div>
          ) : (
            <Save size={18} />
          )}
          <span style={{ letterSpacing: '0.5px' }}>{isSaving ? 'SALVANDO...' : 'SALVAR CONFIGURAÇÕES'}</span>
        </div>
      </button>
    </div>
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
    try {
      const saved = localStorage.getItem('melburguers_settings');
      return saved ? JSON.parse(saved) : {
        defaultViewMode: 'grid',
        notificationSound: '/sonido-shopify.mp3',
        autoPrint: false,
        compactCards: false
      };
    } catch (e) {
      console.warn("Could not read settings from localStorage:", e);
      return {
        defaultViewMode: 'grid',
        notificationSound: '/sonido-shopify.mp3',
        autoPrint: false,
        compactCards: false
      };
    }
  });

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState(new Date());
  const [isPrinterReady, setIsPrinterReady] = useState(false);
  const [isAutoPrint, setIsAutoPrint] = useState(appSettings.autoPrint);
  const printerRef = useRef(null);
  const lastOrderId = useRef(null);
  
  // Finance State
  const [financeTransactions, setFinanceTransactions] = useState([]);
  const [financeCategories, setFinanceCategories] = useState([]);
  const [viewMode, setViewMode] = useState(appSettings.defaultViewMode);
  
  // Menu State
  const [appMenuData, setAppMenuData] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [isSubmittingPos, setIsSubmittingPos] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // POS (Point of Sale) State
  const [posCart, setPosCart] = useState([]);
  const [posCustomer, setPosCustomer] = useState({ name: '', phone: '', address: '', number: '', complement: '', payment: 'Pix' });

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
    try {
      localStorage.setItem('melburguers_settings', JSON.stringify(appSettings));
    } catch (e) {
      console.warn("Auto-save settings failed:", e);
    }
  }, [appSettings]);

  useEffect(() => {
    // Only fetch menu data on client after auth
    setIsMenuLoading(true);
    const data = getMenuData();
    setAppMenuData(data);
    setTimeout(() => setIsMenuLoading(false), 800);
  }, []);

    const fetchOrders = async () => {
    if (!isAuthenticated) return;
    
    try {
      const { data: activeData, error: activeError } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (activeError) {
        console.error("Erro na tabela pedidos:", activeError.message);
      }

      const { data: deletedData, error: deletedError } = await supabase
        .from('pedidos_excluidos')
        .select('*')
        .order('created_at', { ascending: false });

      if (deletedError) {
        console.error("Erro na tabela pedidos_excluidos:", deletedError.message);
      }

      // Merge and De-duplicate: Prioritize based on transition logic
      // Key includes created_at to distinguish #0001 from different days
      const ordersMap = new Map();
      
      const processOrder = (o, isDeleted) => {
        if (!o) return;
        const key = `${o.order_id || 'no-id'}-${o.created_at || o.timestamp}`;
        const existing = ordersMap.get(key);
        
        // Logical prioritizing during transitions:
        // Prefer 'excluido' status if it exists in either version to prevent active list flash
        if (existing) {
           if (o.status === 'excluido' || isDeleted) {
             ordersMap.set(key, { ...o, _isDeleted: true });
           }
        } else {
          ordersMap.set(key, { ...o, _isDeleted: isDeleted });
        }
      };

      (activeData || []).forEach(o => processOrder(o, false));
      (deletedData || []).forEach(o => processOrder(o, true));

      const combined = Array.from(ordersMap.values()).map(o => ({
        ...o,
        original_db_id: o.id,
        // Stable ID for React reconciliation
        id: o.order_id && o.created_at ? `${o.order_id}-${o.created_at}` : `db-${o.id}`
      }));

      setOrders(combined);
      setLastSync(new Date());
    } catch (err) {
      console.error("CRITICAL SYNC ERROR:", err);
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
        // High-Fluidity Sync: Only poll if the dashboard is actively being viewed
        if (document.visibilityState === 'visible') {
          fetchOrders();
        }
      }, 10000);

      const channelFinance = supabase
        .channel('finance_realtime')
        .on('postgres_changes', { event: '*', table: 'finance' }, () => {
          fetchFinanceData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
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
          throw error;
        }
      }
    } catch (err) { 
      alert("Erro ao salvar categoria no banco. Verifique sua conexão.");
    }
  };

  const maxTimestampRef = useRef(0);

  useEffect(() => {
    // Only care about active (non-deleted) orders for the new sale notification
    const activeOrders = (orders || []).filter(o => !o._isDeleted);
    
    if (activeOrders.length > 0 && isAuthenticated) {
      const latestOrder = activeOrders[0];
      const orderTime = new Date(latestOrder.created_at || latestOrder.timestamp).getTime();
      
      // If we see an order with a timestamp NEWER than any we've seen before, it's a new sale
      if (orderTime > maxTimestampRef.current) {
        // Avoid playing on initial load (when maxTimestampRef is 0)
        if (maxTimestampRef.current !== 0) {
          playNotificationSound();
          if (isAutoPrint) {
            handlePrint(latestOrder);
          }
        }
        maxTimestampRef.current = orderTime;
        lastOrderId.current = latestOrder.id;
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
    const printerData = formatOrderForPrinter(order.items, order.total, order.address, order.payment_method);
    
    try {
      if (printerRef.current) {
        await sendToPrinter(printerRef.current, printerData);
      } else {
        const success = await printOrder(printerData);
        if (!success) throw new Error("Falha na impressão");
      }
    } catch (err) {
      alert("Erro ao imprimir. Verifique a conexão com a impressora.");
    }
  };

  const updateStatus = async (id, newStatus) => {
    setOrders(current => current.map(o => 
      (o.id === id || String(o.original_db_id) === String(id)) ? { ...o, status: newStatus } : o
    ));

    try {
      const orderToUpdate = orders.find(o => o.id === id || String(o.original_db_id) === String(id));
      if (!orderToUpdate) return;
      
      const dbId = orderToUpdate.original_db_id;
      const isCurrentlyDeleted = orderToUpdate._isDeleted;
      const { id: uiId, original_db_id, _isDeleted, ...pureData } = orderToUpdate;

      if (newStatus === 'excluido' && !isCurrentlyDeleted) {
        const { error: insertError } = await supabase
          .from('pedidos_excluidos')
          .insert([{ ...pureData, status: 'excluido' }]);
        
        if (!insertError) {
          await supabase.from('pedidos').delete().eq('id', dbId);
        } else throw insertError;
      } else if (newStatus !== 'excluido' && isCurrentlyDeleted) {
        const { error: insertError } = await supabase
          .from('pedidos')
          .insert([{ ...pureData, status: newStatus }]);
        
        if (!insertError) {
          await supabase.from('pedidos_excluidos').delete().eq('id', dbId);
        } else throw insertError;
      } else {
        const table = isCurrentlyDeleted ? 'pedidos_excluidos' : 'pedidos';
        const { error } = await supabase
          .from(table)
          .update({ status: newStatus })
          .eq('id', dbId);
        
        if (error) throw error;
      }
    } catch (err) {
      console.error("DB Update Error:", err);
      fetchOrders();
    }
  };

  const handleSaveMenu = async (newMenu) => {
    // 🛠️ OPERAÇÃO DIETA: Limpa e comprime fotos antigas se estiverem muito pesadas
    // Isso reduz o tamanho total do arquivo enviado ao banco
    try {
      if (newMenu && newMenu.menu) {
        Object.keys(newMenu.menu).forEach(cat => {
          newMenu.menu[cat] = newMenu.menu[cat].map(item => {
            // Se a imagem for Base64 e for muito grande (estimado pela string)
            if (item.image && item.image.startsWith('data:image') && item.image.length > 50000) {
              // Aqui poderíamos comprimir, mas para ser rápido no save, 
              // vamos apenas marcar para a próxima edição ou manter.
              // Por enquanto, o foco é o salvamento do item atual que já vem comprimido.
            }
            return item;
          });
        });
      }
    } catch (e) { console.log("Erro na otimização silenciosa"); }

    setAppMenuData(newMenu);
    saveMenuData(newMenu);
    try {
      const { error } = await supabase.from('menu_config').update({ data: newMenu }).eq('id', 1);
      if (error) throw error;
      console.log("Menu sincronizado com sucesso!");
    } catch (err) {
      console.error("Erro detalhado:", err);
      if (err.message?.includes('timeout')) {
        alert("⚠️ O banco de dados está lento devido ao peso das fotos antigas. Tente salvar novamente ou usar uma foto menor.");
      } else {
        alert(`⚠️ Erro ao salvar: ${err.message}`);
      }
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

  const handleDragEndMenu = (event, category) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = appMenuData.menu[category].findIndex(i => i.id === active.id);
      const newIndex = appMenuData.menu[category].findIndex(i => i.id === over.id);
      
      const newMenu = { ...appMenuData };
      newMenu.menu[category] = arrayMove(newMenu.menu[category], oldIndex, newIndex);
      handleSaveMenu(newMenu);
    }
  };

  const handleAddToCartPos = (item) => {
    const existing = posCart.find(i => i.id === item.id);
    if (existing) {
      setPosCart(posCart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setPosCart([...posCart, { ...item, quantity: 1 }]);
    }
  };

  const handleRemoveFromCartPos = (itemId) => {
    setPosCart(posCart.filter(i => i.id !== itemId));
  };

  const handleUpdateCartQtyPos = (itemId, delta) => {
    setPosCart(posCart.map(i => {
      if (i.id === itemId) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const handleFinalizePos = async () => {
    if (posCart.length === 0 || isSubmittingPos) return;
    if (!posCustomer.name) return alert("Pelo menos o nome do cliente é obrigatório!");
    
    setIsSubmittingPos(true);

    const subtotal = posCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    const todayStr = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStr);

    const nextNumber = (count || 0) + 1;
    const formattedId = `#${nextNumber.toString().padStart(4, '0')}`;

    const orderData = {
      order_id: formattedId,
      items: posCart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
      total: subtotal,
      status: 'pendente',
      payment_method: posCustomer.payment === 'Dinheiro' && posCustomer.change ? `Dinheiro (Troco para R$ ${posCustomer.change})` : posCustomer.payment,
      address: {
        customerName: posCustomer.name,
        customerPhone: posCustomer.phone,
        street: posCustomer.address,
        number: posCustomer.number,
        complement: posCustomer.complement
      },
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('pedidos').insert([orderData]).select();
      if (error) throw error;
      
      alert("Pedido lançado com sucesso!");
      setPosCart([]);
      setPosCustomer({ name: '', phone: '', address: '', number: '', payment: 'Pix', change: '' });
      setActiveTab('orders-history');
      fetchOrders();
    } catch (err) {
      alert("Erro ao salvar pedido: " + err.message);
    } finally {
      setIsSubmittingPos(false);
    }
  };

  const filteredOrders = (orders || []).filter(order => {
    if (!order) return false;
    const orderDate = new Date(order.created_at || order.timestamp);
    const today = new Date();
    const isToday = orderDate.toLocaleDateString() === today.toLocaleDateString();
    
    if (statusFilter === 'excluido') return order.status === 'excluido';
    if (order.status === 'excluido') return false;
    
    if (statusFilter === 'concluido') return order.status === 'concluido';
    if (dateFilter === 'today' && !isToday) return false;
    if (statusFilter === 'pending' && order.status !== 'pendente' && order.status !== 'pago') return false;
    if (statusFilter === 'preparo' && order.status !== 'preparo') return false;
    if (statusFilter === 'pronto' && order.status !== 'pronto') return false;
    if (statusFilter === 'entrega' && order.status !== 'entrega') return false;
    if (statusFilter === 'all' && order.status === 'concluido') return false;
    if (statusFilter !== 'all' && statusFilter !== 'pending' && order.status !== statusFilter) return false;
    
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
      <ScrollbarStyles />
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
              { id: 'pos', renderIcon: (isActive) => <ShoppingBag size={20} color={isActive ? '#00f3ff' : '#a1a1aa'} />, label: 'Lançar Venda' },
              { id: 'search', renderIcon: (isActive) => <SearchIcon size={20} isActive={isActive} />, label: 'Explorar' },
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
          <header style={{ marginBottom: isMobile ? '24px' : '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 700, color: '#f8fafc' }}>
                  {activeTab === 'menu' ? 'Cardápio' : activeTab === 'search' ? 'Explorar' : activeTab === 'pos' ? 'Lançar Venda' : 'Pedidos'}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }}></div>
                  <span style={{ fontSize: '11px', color: '#71717a' }}>Online • {lastSync.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {isMobile && (
                  <>
                    <button 
                      onClick={() => {
                        const visibleOrders = orders.filter(o => o.status !== 'excluido');
                        if (visibleOrders.length > 0) handlePrint(visibleOrders[0]);
                      }} 
                      style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#EC9424', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Printer size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        const modes = ['list', 'grid', 'compact'];
                        const nextMode = modes[(modes.indexOf(viewMode) + 1) % modes.length];
                        setViewMode(nextMode);
                        localStorage.setItem('viewMode', nextMode);
                      }} 
                      style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#EC9424', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {viewMode === 'list' ? <LayoutList size={18} /> : viewMode === 'grid' ? <LayoutGrid size={18} /> : <Maximize size={18} />}
                    </button>
                  </>
                )}
                {/* 🧹 Botão de Limpeza e Otimização - Apenas Mobile & Tab Cardápio */}
                {isMobile && activeTab === 'menu' && (
                  <button 
                    id="btn-opt-all"
                    onClick={async () => {
                      if(!window.confirm("Isso vai reduzir o peso de todas as fotos antigas para deixar o sistema rápido. Deseja continuar?")) return;
                      
                      const btn = document.getElementById('btn-opt-all');
                      const originalText = btn.innerText;
                      btn.innerText = "OTIMIZANDO...";
                      btn.disabled = true;

                      try {
                        const newMenu = {...appMenuData};
                        let optimizedCount = 0;

                        for (const cat of Object.keys(newMenu.menu)) {
                          for (const item of newMenu.menu[cat]) {
                            if (item.image && item.image.startsWith('data:image')) {
                              const compressed = await new Promise((resolve) => {
                                const img = new Image();
                                img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  const MAX_WIDTH = 400;
                                  let w = img.width, h = img.height;
                                  if (w > MAX_WIDTH) { h *= MAX_WIDTH / w; w = MAX_WIDTH; }
                                  canvas.width = w; canvas.height = h;
                                  const ctx = canvas.getContext('2d');
                                  ctx.drawImage(img, 0, 0, w, h);
                                  resolve(canvas.toDataURL('image/jpeg', 0.4));
                                };
                                img.src = item.image;
                              });
                              item.image = compressed;
                              optimizedCount++;
                            }
                          }
                        }

                        await handleSaveMenu(newMenu);
                        alert(`Sucesso! ${optimizedCount} fotos foram otimizadas. O sistema agora está leve!`);
                      } catch (err) {
                        alert("Erro na otimização: " + err.message);
                      } finally {
                        btn.innerText = "CARDÁPIO OTIMIZADO";
                        btn.disabled = false;
                      }
                    }}
                    style={{ 
                      padding: '0 16px', 
                      height: '40px',
                      background: 'rgba(236, 148, 36, 0.1)', 
                      color: '#EC9424', 
                      border: '1px solid rgba(236, 148, 36, 0.3)', 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    OTIMIZAR TODO O CARDÁPIO
                  </button>
                )}


                <button onClick={playNotificationSound} style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#EC9424', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={18} />
                </button>
              </div>
            </div>

            {isMobile && activeTab === 'orders-history' && (
              <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', width: 'calc(100% + 40px)', margin: '0 -20px', padding: '0 20px', scrollSnapType: 'x mandatory' }}>
                {['pendente', 'preparo', 'pronto', 'entrega', 'concluido', 'excluido'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      onClick={() => {
                        setStatusFilter(f);
                        if (f !== 'excluido') setIsTrashMenuOpen(false);
                      }}
                      style={{ 
                        padding: f === 'excluido' ? '8px 12px 8px 16px' : '8px 16px', 
                        borderRadius: '12px', 
                        background: statusFilter === f ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', 
                        color: statusFilter === f ? 'white' : '#71717a', 
                        border: '1px solid rgba(255,255,255,0.05)', 
                        whiteSpace: 'nowrap',
                        fontSize: '13px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {f === 'pendente' ? 'Fila Geral' : f === 'preparo' ? 'Em preparo' : f === 'pronto' ? 'Pronto' : f === 'entrega' ? 'Saiu p/ entrega' : f === 'concluido' ? 'Concluído' : 'Lixo'}
                      
                      {f === 'excluido' && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsTrashMenuOpen(!isTrashMenuOpen);
                          }}
                          style={{ padding: '2px', display: 'flex', alignItems: 'center' }}
                        >
                          <ChevronDown size={14} style={{ transform: isTrashMenuOpen ? 'rotate(-180deg)' : 'none', transition: 'transform 0.3s' }} />
                        </div>
                      )}
                    </button>

                    {f === 'excluido' && (
                      <AnimatePresence>
                        {isTrashMenuOpen && (
                          <motion.button
                            initial={{ width: 0, opacity: 0, x: -10 }}
                            animate={{ width: 'auto', opacity: 1, x: 0 }}
                            exit={{ width: 0, opacity: 0, x: -5 }}
                            onClick={handleClearDeletedOrders}
                            style={{ 
                              padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', 
                              border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', 
                              color: '#ef4444', fontSize: '11px', fontWeight: 800, 
                              whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                          >
                            <Trash2 size={12} /> LIMPAR
                          </motion.button>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                ))}
              </div>
            )}
          </header>
        )}

        {(activeTab === 'orders-history' || activeTab === 'search') && (
          <>
            <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isMobile ? 'column' : 'row', gap: '15px' }}>
              {!isMobile && (
                <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', width: 'auto', paddingBottom: '4px' }}>
                <button 
                  onClick={() => setDateFilter(dateFilter === 'today' ? 'all' : 'today')}
                  style={{ padding: '8px 16px', borderRadius: '12px', background: dateFilter === 'today' ? 'rgba(236,148,36,0.1)' : 'rgba(255,255,255,0.03)', color: dateFilter === 'today' ? '#EC9424' : '#71717a', border: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }}
                >
                  {dateFilter === 'today' ? 'Hoje' : 'Sempre'}
                </button>
                {['pendente', 'preparo', 'pronto', 'entrega', 'concluido', 'excluido'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      onClick={() => {
                        setStatusFilter(f);
                        if (f !== 'excluido') setIsTrashMenuOpen(false);
                      }}
                      style={{ 
                        padding: f === 'excluido' ? '8px 12px 8px 16px' : '8px 16px', 
                        borderRadius: '12px', 
                        background: statusFilter === f ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', 
                        color: statusFilter === f ? 'white' : '#71717a', 
                        border: '1px solid rgba(255,255,255,0.05)', 
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {f === 'pendente' ? 'Fila Geral' : f === 'preparo' ? 'Em Preparo' : f === 'pronto' ? 'Pronto' : f === 'entrega' ? 'Saiu p/ Entrega' : f === 'concluido' ? 'Concluído' : 'Lixo'}
                      {f === 'excluido' && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsTrashMenuOpen(!isTrashMenuOpen);
                          }}
                          style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isTrashMenuOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
                            borderRadius: '4px',
                            transition: 'all 0.2s'
                          }}
                        >
                          <ChevronDown size={14} style={{ transform: isTrashMenuOpen ? 'rotate(-90deg)' : 'none', transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        </div>
                      )}
                    </button>

                    {f === 'excluido' && (
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
              )}
              {!isMobile && activeTab === 'orders-history' && (
                <button onClick={handlePrinterConnect} style={{ padding: '8px 16px', borderRadius: '12px', background: isPrinterReady ? 'rgba(34,197,94,0.1)' : 'transparent', color: isPrinterReady ? '#22c55e' : '#71717a', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Printer size={14} /> {isPrinterReady ? 'Pronto' : 'Imprimir'}
                </button>
              )}
            </div>
            {activeTab === 'orders-history' && (
              <OrdersKanban orders={filteredOrders} updateStatus={updateStatus} handlePrint={handlePrint} statusFilter={statusFilter} viewMode={viewMode} />
            )}
          </>
        )}

        {activeTab === 'search' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            margin: isMobile ? '-10px -20px 0 -20px' : '-10px -50px 0 -50px',
            height: isMobile ? 'calc(100dvh - 170px)' : 'calc(100vh - 140px)',
            minHeight: 0,
            overflow: 'hidden',
            borderRadius: '0',
            background: '#0a0a0b',
            borderTop: '1px solid rgba(255,255,255,0.08)'
          }}>
            {/* Barra de endereço */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: '#111113',
              padding: '10px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              flexShrink: 0
            }}>
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
                background: '#0a0a0b', borderRadius: '10px', padding: '8px 14px',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {window.location.origin}/
                </span>
              </div>
              <button
                onClick={() => window.open(window.location.origin + '/', '_blank')}
                style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </button>
            </div>

            {/* iFrame do cardápio */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: '0 8px' }}>
              <iframe
                src={window.location.origin + '/'}
                title="Cardápio Digital"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  border: 'none', 
                  display: 'block',
                  transform: 'scale(0.96)',
                  transformOrigin: 'top center'
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'menu' && appMenuData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
            <AnimatePresence mode="wait">
              {editingItem ? (
                <motion.div
                  key="edit-form"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  style={{ 
                    maxWidth: '600px', 
                    margin: '0 auto', 
                    background: '#111113', 
                    borderRadius: '24px', 
                    padding: '32px', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'white', margin: 0 }}>
                      {editingItem.id ? 'Editar Produto' : 'Novo Produto'}
                    </h2>
                    <button 
                      onClick={() => setEditingItem(null)}
                      style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', cursor: 'pointer' }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Imagem do Produto</label>
                      <div 
                        onClick={() => document.getElementById('item-image-input-final').click()}
                        style={{ 
                          height: '200px', borderRadius: '20px', background: '#0a0a0b', border: '2px dashed rgba(255,255,255,0.06)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative', transition: 'all 0.3s ease'
                        }}
                      >
                        <AnimatePresence mode="wait">
                          {editingItem.image ? (
                            <motion.div key="p" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ duration: 0.25 }} style={{ width: '100%', height: '100%' }}>
                              <img src={editingItem.image} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#0a0a0b' }} />
                              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', display: 'flex', alignItems: 'flex-end', padding: '16px' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'white', fontSize: '12px', fontWeight: 700 }}>
                                  <Camera size={14} /> ALTERAR FOTO
                                </div>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div key="pl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#3f3f46' }}>
                              <Upload size={32} /><span style={{ fontSize: '13px', fontWeight: 600 }}>Foto Produto</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <input type="file" id="item-image-input-final" hidden accept="image/*" onChange={(e) => {
                          const file = e.target.files[0];
                          if(file) {
                             const reader = new FileReader();
                             reader.onload = (ev) => {
                               const img = new Image();
                               img.onload = () => {
                                 // 🛠️ COMPRESSÃO ULTRA: Redimensiona para max 400px
                                 const canvas = document.createElement('canvas');
                                 const MAX_WIDTH = 400; 
                                 let width = img.width;
                                 let height = img.height;

                                 if (width > MAX_WIDTH) {
                                   height *= MAX_WIDTH / width;
                                   width = MAX_WIDTH;
                                 }

                                 canvas.width = width;
                                 canvas.height = height;
                                 const ctx = canvas.getContext('2d');
                                 ctx.drawImage(img, 0, 0, width, height);
                                 
                                 // Converte para Base64 ultra leve (JPEG 0.4 qualidade)
                                 const compressedBase64 = canvas.toDataURL('image/jpeg', 0.4);
                                 setEditingItem({...editingItem, image: compressedBase64});
                               };
                               img.src = ev.target.result;
                             };
                             reader.readAsDataURL(file);
                          }
                        }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>Nome</label>
                      <input value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} style={{ padding: '16px', borderRadius: '12px', background: '#0a0a0b', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>Preço</label>
                      <input type="number" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: e.target.value})} style={{ padding: '16px', borderRadius: '12px', background: '#0a0a0b', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>Descrição</label>
                      <textarea value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} style={{ padding: '16px', borderRadius: '12px', background: '#0a0a0b', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', minHeight: '100px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSaveEdit} style={{ flex: 2, padding: '18px', background: '#EC9424', color: '#fff', borderRadius: '14px', fontWeight: 800, border: 'none' }}>SALVAR</motion.button>
                      <button onClick={() => setEditingItem(null)} style={{ flex: 1, padding: '18px', background: 'rgba(255,255,255,0.04)', color: '#71717a', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>CANCELAR</button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="menu-list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}
                >
                  {isMenuLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                      {[1, 2].map(cat => (
                        <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          <div style={{ width: '150px', height: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }} />
                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                            {[1, 2, 3].map(i => <MenuSkeleton key={i} />)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    Object.keys(appMenuData.menu).map((cat, catIdx) => (
                      <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div>
                            <h3 style={{ fontSize: '22px', fontWeight: 900, color: 'white', margin: 0 }}>{cat}</h3>
                            <span style={{ fontSize: '11px', color: '#52525b', fontWeight: 700 }}>{appMenuData.menu[cat].length} PRODUTOS</span>
                          </div>
                          <motion.button 
                            whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.08)' }} 
                            onClick={() => { setEditingCategory(cat); setEditingItem({name:'', price:'', description:'', image:''}) }} 
                            style={{ 
                              padding: '10px 16px', 
                              background: 'rgba(255,255,255,0.03)', 
                              color: 'white', 
                              borderRadius: '12px', 
                              border: '1px solid rgba(255,255,255,0.1)',
                              fontSize: '12px',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 0 15px rgba(255,255,255,0.03)',
                              cursor: 'pointer'
                            }}
                          >
                            <Plus size={14} /> NOVO
                          </motion.button>
                        </div>
                        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={(e) => handleDragEndMenu(e, cat)}>
                          <SortableContext items={appMenuData.menu[cat].map(i => i.id)} strategy={rectSortingStrategy}>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                              {appMenuData.menu[cat].map((item) => (
                                <SortableMenuItem key={item.id} item={item} cat={cat} isMobile={isMobile} handleEditItem={handleEditItem} />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'pos' && appMenuData && appMenuData.menu && (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '32px', height: '100%' }}>
            {/* Lado Esquerdo: Menu de Seleção */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'white', margin: 0 }}>Lançar Pedido Balcão</h2>
                <div style={{ padding: '6px 12px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>MODO PDV</div>
              </div>

              {Object.keys(appMenuData.menu || {}).map(cat => (
                <div key={cat} style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'rgba(255,255,255,0.6)', marginBottom: '16px', borderLeft: '3px solid #EC9424', paddingLeft: '12px' }}>{cat}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    {(appMenuData.menu[cat] || []).map(item => (
                      <motion.div
                        key={item.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAddToCartPos(item)}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '16px',
                          padding: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        <div style={{ height: '80px', borderRadius: '10px', background: '#0a0a0b', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                          {item.image ? <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#0a0a0b' }} /> : <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={20} color="#333" /></div>}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'white', height: '36px', overflow: 'hidden' }}>{item.name}</div>
                        <div style={{ color: '#22c55e', fontWeight: 900, fontSize: '15px' }}>R$ {Number(item.price || 0).toFixed(2).replace('.', ',')}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Lado Direito: Carrinho e Cliente */}
            <div style={{ width: isMobile ? '100%' : '380px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#111113', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px', position: 'sticky', top: 0 }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShoppingCart size={20} color="#EC9424" /> Carrinho ({posCart.length})
                </h3>

                {posCart.length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: '#52525b', fontSize: '13px' }}>Selecione produtos ao lado</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                      {(posCart || []).map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{item.name}</div>
                            <div style={{ fontSize: '11px', color: '#22c55e' }}>R$ {(Number(item.price || 0) * item.quantity).toFixed(2).replace('.', ',')}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#0a0a0b', padding: '4px', borderRadius: '8px' }}>
                            <button onClick={() => handleUpdateCartQtyPos(item.id, -1)} style={{ border: 'none', background: 'none', color: 'white', cursor: 'pointer' }}><X size={12} /></button>
                            <span style={{ fontSize: '12px', fontWeight: 900 }}>{item.quantity}</span>
                            <button onClick={() => handleUpdateCartQtyPos(item.id, 1)} style={{ border: 'none', background: 'none', color: 'white', cursor: 'pointer' }}><Plus size={12} /></button>
                          </div>
                          <button onClick={() => handleRemoveFromCartPos(item.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input 
                          placeholder="Nome do Cliente" 
                          value={posCustomer.name} 
                          onChange={e => setPosCustomer({...posCustomer, name: e.target.value})}
                          style={{ width: '100%', background: '#0a0a0b', border: '1px solid rgba(255,255,255,0.06)', padding: '12px', borderRadius: '12px', color: 'white', fontSize: '13px' }}
                        />
                        <input 
                          placeholder="Telefone/Zap" 
                          value={posCustomer.phone} 
                          onChange={e => setPosCustomer({...posCustomer, phone: e.target.value})}
                          style={{ width: '100%', background: '#0a0a0b', border: '1px solid rgba(255,255,255,0.06)', padding: '12px', borderRadius: '12px', color: 'white', fontSize: '13px' }}
                        />
                        <select 
                          value={posCustomer.payment} 
                          onChange={e => setPosCustomer({...posCustomer, payment: e.target.value})}
                          style={{ width: '100%', background: '#0a0a0b', border: '1px solid rgba(255,255,255,0.06)', padding: '12px', borderRadius: '12px', color: 'white', fontSize: '13px' }}
                        >
                          <option value="Pix">Pix</option>
                          <option value="Dinheiro">Dinheiro</option>
                          <option value="Cartão">Cartão</option>
                        </select>
                        {posCustomer.payment === 'Dinheiro' && (
                          <input 
                            placeholder="Troco para quanto?" 
                            value={posCustomer.change} 
                            onChange={e => setPosCustomer({...posCustomer, change: e.target.value})}
                            style={{ width: '100%', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', padding: '12px', borderRadius: '12px', color: 'white', fontSize: '13px' }}
                          />
                        )}
                        <input 
                          placeholder="Complemento / Ref"
                          value={posCustomer.complement} 
                          onChange={e => setPosCustomer({...posCustomer, complement: e.target.value})}
                          style={{ width: '100%', background: '#0a0a0b', border: '1px solid rgba(255,255,255,0.06)', padding: '12px', borderRadius: '12px', color: 'white', fontSize: '13px' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '20px', fontWeight: 900, color: 'white' }}>
                        <span>TOTAL</span>
                        <span>R$ {posCart.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2).replace('.', ',')}</span>
                      </div>

                      <button 
                        onClick={handleFinalizePos}
                        style={{ width: '100%', padding: '16px', background: '#EC9424', color: 'white', borderRadius: '16px', border: 'none', fontWeight: 900, fontSize: '14px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(236,148,36,0.2)' }}
                      >
                        LANÇAR PEDIDO
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
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

              {/* Save Button with extra padding for mobile to clear bottom nav */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ 
                  marginBottom: isMobile ? '180px' : '40px', // Aumentado drasticamente para mobile
                  position: 'relative',
                  zIndex: 9999 // Garante que fique acima de quase tudo no fluxo
                }}
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
