import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Clock, ArrowRight, MapPin, Sun, Moon,
  BadgeCheck, ShoppingBag, Truck, ShoppingCart,
  Trash2, ChevronDown, CheckCircle2, MoreHorizontal, UserPlus, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { supabase } from './utils/supabase';
import { getMenuData } from './utils/menuStore';

const HoneySVG = ({ id }) => (
  <span className="honey-svg" aria-hidden="true">
    <svg viewBox="0 0 220 90" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`honeyFill-${id}`} x1="110" y1="0" x2="110" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF17A"/>
          <stop offset="25%" stopColor="#FFD400"/>
          <stop offset="65%" stopColor="#FFB300"/>
          <stop offset="100%" stopColor="#F08A00"/>
        </linearGradient>
        <linearGradient id={`honeyStroke-${id}`} x1="0" y1="0" x2="220" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E08A00"/>
          <stop offset="50%" stopColor="#FFC52A"/>
          <stop offset="100%" stopColor="#D97706"/>
        </linearGradient>
        <filter id={`honeyShadow-${id}`} x="-20%" y="-30%" width="140%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#C97700" floodOpacity="0.25"/>
        </filter>
      </defs>

      <path
        d="M16 24
           C28 10, 46 8, 68 10
           C88 11, 107 9, 126 9
           C144 9, 164 11, 184 10
           C198 10, 208 13, 212 21
           C210 28, 204 30, 198 30
           C191 30, 186 34, 185 40
           C184 47, 180 52, 172 52
           C163 52, 159 45, 160 37
           C161 30, 157 26, 149 26
           C141 26, 136 30, 136 38
           C136 48, 131 54, 121 54
           C111 54, 106 47, 106 36
           C106 29, 102 25, 94 25
           C84 25, 80 30, 80 41
           C80 53, 74 60, 63 60
           C51 60, 44 52, 45 39
           C46 30, 41 26, 31 26
           C24 26, 19 25, 16 24Z"
        fill={`url(#honeyFill-${id})`}
        stroke={`url(#honeyStroke-${id})`}
        strokeWidth="2.4"
        filter={`url(#honeyShadow-${id})`}
      />

      <path
        d="M52 20 C82 13, 118 13, 164 18"
        fill="none"
        stroke="rgba(255,255,255,0.48)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <ellipse cx="46" cy="24" rx="18" ry="8" fill="secondary" style={{ fill: 'rgba(255,255,255,0.22)' }} />
      <ellipse cx="131" cy="19" rx="26" ry="7" fill="secondary" style={{ fill: 'rgba(255,255,255,0.16)' }} />
      <ellipse cx="177" cy="22" rx="16" ry="5" fill="secondary" style={{ fill: 'rgba(255,255,255,0.18)' }} />
    </svg>
  </span>
);

const SobremesaHoneySVG = ({ id }) => (
  <span className="honey-svg" aria-hidden="true" style={{ width: '82px', top: '-7px' }}>
    <svg viewBox="0 0 180 52" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`honeyFillWide-${id}`} x1="90" y1="0" x2="90" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF3A6"/>
          <stop offset="22%" stopColor="#FFD84A"/>
          <stop offset="58%" stopColor="#FFBE14"/>
          <stop offset="100%" stopColor="#E58A00"/>
        </linearGradient>
        <linearGradient id={`honeyStrokeWide-${id}`} x1="0" y1="0" x2="180" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D98500"/>
          <stop offset="50%" stopColor="#FFC12A"/>
          <stop offset="100%" stopColor="#D98500"/>
        </linearGradient>
        <filter id={`honeyShadowWide-${id}`} x="-20%" y="-20%" width="140%" height="180%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="3" floodColor="#C97B00" floodOpacity="0.22"/>
        </filter>
      </defs>

      <path
        d="M12 18 C22 8, 38 6, 56 8 C72 10, 90 10, 108 8 C126 6, 144 7, 160 10 C168 12, 172 15, 170 20 C167 22, 164 23, 160 23 C154 23, 150 25, 149 30 C148 36, 144 40, 138 40 C132 40, 128 36, 128 30 C128 25, 125 22 120 22 C114 22, 111 25, 111 32 C111 40, 106 45, 99 45 C91 45, 87 39, 87 31 C87 25, 84 22, 79 22 C73 22, 69 25, 69 31 C69 38, 65 42, 58 42 C50 42, 46 37, 46 29 C46 24, 43 22, 38 22 C31 22, 27 25, 27 32 C27 40, 22 45, 15 45 C8 45, 5 38, 8 29 C10 24, 12 21, 12 18 Z"
        fill={`url(#honeyFillWide-${id})`}
        stroke={`url(#honeyStrokeWide-${id})`}
        strokeWidth="2.2"
        filter={`url(#honeyShadowWide-${id})`}
      />

      <path
        d="M28 13 C55 7, 92 7, 145 12"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      <ellipse cx="38" cy="15" rx="12" ry="5" fill="secondary" style={{ fill: 'rgba(255,255,255,0.18)' }} />
      <ellipse cx="104" cy="13" rx="18" ry="4.5" fill="secondary" style={{ fill: 'rgba(255,255,255,0.13)' }} />
      <ellipse cx="145" cy="16" rx="10" ry="4" fill="secondary" style={{ fill: 'rgba(255,255,255,0.15)' }} />

      <ellipse cx="138" cy="30" rx="3.5" ry="7" fill="secondary" style={{ fill: 'rgba(255,255,255,0.18)' }} />
      <ellipse cx="99" cy="34" rx="4" ry="8" fill="secondary" style={{ fill: 'rgba(255,255,255,0.18)' }} />
      <ellipse cx="58" cy="31" rx="3.5" ry="7" fill="secondary" style={{ fill: 'rgba(255,255,255,0.16)' }} />
      <ellipse cx="15" cy="33" rx="3" ry="6" fill="secondary" style={{ fill: 'rgba(255,255,255,0.14)' }} />
    </svg>
  </span>
);

const ADD_ONS = [
  { id: 'carne_picanha', name: 'Carne de picanha', price: 6.00, icon: '🥩' },
  { id: 'cheddar', name: 'Cheddar', price: 3.00, icon: '🧀' },
  { id: 'bacon', name: 'Bacon', price: 3.00, icon: '🥓' },
  { id: 'calabresa', name: 'Calabresa', price: 2.99, icon: '🌭' },
  { id: 'batata_pequena', name: 'Batata Pequena', price: 4.99, icon: '🍟' },
  { 
    id: 'piscina_cheddar', 
    name: 'Piscininha de Cheddar', 
    price: 4.99,
    description: 'Adicional cremoso de cheddar para deixar tudo ainda melhor!',
    image: '/fotos cardapio/piscininha de chedar mel.png'
  }
];

const FidelityCard = ({ fidelityPoints, address, isDarkMode }) => {
  const currentProgress = fidelityPoints % 6;
  const hasDiscount = fidelityPoints > 0 && fidelityPoints % 6 === 5;
  const activeStamps = currentProgress;
  
  return (
    <div 
      style={{ 
        background: isDarkMode ? '#1F1510' : '#FFF9F5', 
        border: `2px solid ${hasDiscount ? '#22c55e' : '#EC9424'}`, 
        borderRadius: '20px', 
        padding: '18px', 
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(236,148,36,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        marginBottom: '16px'
      }}
    >
      {hasDiscount && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          background: '#22c55e',
          color: 'white',
          fontSize: '9px',
          fontWeight: 900,
          padding: '5px 10px',
          borderRadius: '0 0 0 12px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          ATIVADO
        </div>
      )}

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '18px' }}>🎁</span>
          <h3 style={{ 
            fontSize: '14px', 
            fontWeight: 800, 
            color: hasDiscount ? '#22c55e' : '#EC9424',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            margin: 0
          }}>
            Programa de fidelidade
          </h3>
        </div>
        <p style={{ 
          fontSize: '12px', 
          lineHeight: '1.4', 
          color: isDarkMode ? '#D4D4D8' : '#4b5563',
          fontWeight: 500,
          margin: 0
        }}>
          A cada 5 pedidos concluídos e entregues no <strong>mesmo endereço</strong>, você recebe <strong>30% de desconto</strong> (sem contar o frete) no seu 6º pedido!
        </p>
      </div>

      <div style={{ 
        background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
        borderRadius: '14px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '290px' }}>
          {[1, 2, 3, 4, 5, 6].map((slot) => {
            const isStamped = slot <= activeStamps;
            const isSlot6 = slot === 6;
            
            // Custom styling for the green slot 6
            const borderStyle = isSlot6
              ? (hasDiscount 
                  ? '2.5px solid #22c55e' 
                  : `2px dashed ${isDarkMode ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.5)'}`)
              : (isStamped 
                  ? `2.5px solid ${hasDiscount ? '#22c55e' : '#EC9424'}` 
                  : `2px dashed ${isDarkMode ? '#3f3f46' : '#d1d5db'}`);
                  
            const bgStyle = isSlot6
              ? (hasDiscount ? 'rgba(34, 197, 94, 0.15)' : 'transparent')
              : (isStamped 
                  ? (hasDiscount ? 'rgba(34, 197, 94, 0.1)' : 'rgba(236, 148, 36, 0.1)') 
                  : 'transparent');
                  
            const textColor = isSlot6
              ? (isDarkMode ? '#4ade80' : '#22c55e')
              : (isStamped 
                  ? (hasDiscount ? '#22c55e' : '#EC9424') 
                  : (isDarkMode ? '#71717a' : '#9ca3af'));

            const shadowStyle = isSlot6 && hasDiscount
              ? (isDarkMode ? '0 0 14px rgba(74, 222, 128, 0.5)' : '0 0 12px rgba(34, 197, 94, 0.4)')
              : 'none';
              
            const scaleStyle = isSlot6 && hasDiscount ? 'scale(1.1)' : 'scale(1)';

            return (
              <div 
                key={slot}
                style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '50%', 
                  border: borderStyle,
                  background: bgStyle,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '900',
                  fontSize: '13px',
                  color: textColor,
                  boxShadow: shadowStyle,
                  transform: scaleStyle,
                  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
              >
                {isSlot6 ? (
                  hasDiscount ? '🎁' : '6'
                ) : (
                  isStamped ? '✓' : slot
                )}
              </div>
            );
          })}
        </div>

        <div style={{ 
          fontSize: '11px', 
          fontWeight: 700, 
          color: isDarkMode ? '#a1a1aa' : '#4b5563',
          textAlign: 'center',
          width: '100%'
        }}>
          {hasDiscount ? (
            <span style={{ color: '#22c55e', fontWeight: 900 }}>
              🎉 Parabéns! 30% de desconto ativado no pedido atual!
            </span>
          ) : (
            <span>
              Você tem <strong style={{ color: '#EC9424', fontSize: '13px' }}>{fidelityPoints}</strong> {fidelityPoints === 1 ? 'ponto' : 'pontos'}
              {fidelityPoints > 0 && ` (${currentProgress}/5 para o desconto)`}
            </span>
          )}
          
          <div style={{ 
            marginTop: '8px',
            padding: '8px 10px',
            background: isDarkMode ? 'rgba(236,148,36,0.08)' : 'rgba(236,148,36,0.04)',
            borderRadius: '10px',
            fontSize: '10px',
            lineHeight: '1.4',
            textAlign: 'left',
            color: '#EC9424',
            border: `1px solid ${isDarkMode ? 'rgba(236,148,36,0.15)' : 'rgba(236,148,36,0.1)'}`
          }}>
            {address && address.street && address.number ? (
              <div>
                <strong>📍 Endereço Ativo:</strong> {address.street}, {address.number}
                <div style={{ fontSize: '9px', opacity: 0.8, marginTop: '2px', color: isDarkMode ? '#a1a1aa' : '#6b7280' }}>
                  *Os pontos acumulam e são válidos apenas para este exato endereço de pagamento.
                </div>
              </div>
            ) : (
              <div style={{ color: '#ef4444', fontWeight: 600 }}>
                ⚠️ Preencha rua e número no checkout para validar e exibir seus pontos de fidelidade.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [appMenuData, setAppMenuData] = useState(getMenuData());
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [address, setAddress] = useState(() => {
    const saved = localStorage.getItem('melburgers_customer_data');
    return saved ? JSON.parse(saved) : {
      street: '', number: '', neighborhood: '', complement: '', zipCode: '', customerName: '', customerPhone: '',
    };
  });
  const [deliveryFee, setDeliveryFee] = useState(() => {
    const saved = localStorage.getItem('melburgers_delivery_fee');
    return saved ? parseFloat(saved) : 0;
  });
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [changeNeeded, setChangeNeeded] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('melburgers_theme') === 'dark';
  });
  const [locationError, setLocationError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastCheckoutTime = useRef(0);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [isMyOrdersLoading, setIsMyOrdersLoading] = useState(false);
  const [fidelityPoints, setFidelityPoints] = useState(0);
  const [isFidelityLoading, setIsFidelityLoading] = useState(false);

  const fetchFidelityPoints = async () => {
    if (!address.customerPhone) {
      setFidelityPoints(0);
      return;
    }
    // Se não tiver preenchido rua ou número, não podemos contabilizar os pontos para esse endereço
    if (!address.street || !address.number) {
      setFidelityPoints(0);
      return;
    }
    
    setIsFidelityLoading(true);
    try {
      const { count, error } = await supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true })
        .eq('address->>customerPhone', address.customerPhone)
        .eq('address->>street', address.street)
        .eq('address->>number', address.number)
        .eq('status', 'concluido');
      
      if (error) throw error;
      setFidelityPoints(count || 0);
    } catch (err) {
      console.error("Erro ao buscar pontos de fidelidade:", err);
    } finally {
      setIsFidelityLoading(false);
    }
  };
  const [configuringItem, setConfiguringItem] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAnimatedAddToCart = async () => {
    if (isAddingToCart) return;
    setIsAddingToCart(true);
    // Tempo total da animação coreográfica cinematográfica (3.0s + margem)
    await new Promise(resolve => setTimeout(resolve, 3100));
    addToCart(configuringItem, selectedAddOns);
    setIsAddingToCart(false);
  };

  // === PERSISTÊNCIA DE DADOS ===
  useEffect(() => {
    localStorage.setItem('melburgers_customer_data', JSON.stringify(address));
  }, [address]);

  useEffect(() => {
    if (address.customerPhone && address.street && address.number) {
      fetchFidelityPoints();
    } else {
      setFidelityPoints(0);
    }
  }, [address.customerPhone, address.street, address.number]);

  useEffect(() => {
    localStorage.setItem('melburgers_delivery_fee', deliveryFee.toString());
  }, [deliveryFee]);

  useEffect(() => {
    localStorage.setItem('melburgers_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // === CARREGAMENTO E SINCRONIZAÇÃO DO MENU ===
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const { data, error } = await supabase.from('menu_config').select('data').eq('id', 1).single();
        if (data) {
          setAppMenuData(data.data);
          const catsOrder = data.data.categoriesOrder || Object.keys(data.data.menu || {});
          if (catsOrder.length > 0 && !activeCategory) setActiveCategory(catsOrder[0]);
        }
      } catch (err) {
        console.error("Erro ao carregar menu:", err);
      } finally {
        setIsMenuLoading(false);
      }
    };

    fetchMenu();

    // 🚀 SINCRONIZAÇÃO EM TEMPO REAL: Ouve mudanças no banco e atualiza na hora
    const channel = supabase
      .channel('menu_realtime_customer')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'menu_config',
        filter: 'id=eq.1'
      }, (payload) => {
        if (payload.new && payload.new.data) {
          setAppMenuData(payload.new.data);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // === GEOLOCALIZAÇÃO E BUSCA DE ENDEREÇO ===
  const SHOP_COORDS = { lat: -22.6225, lng: -42.0163 };

  const normalizeString = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  };

  const getCalculatedFee = (distance, streetName = "") => {
    if (streetName.toLowerCase().includes("lebres")) return 7;
    let fee = 5;
    if (distance > 2) fee += (distance - 2) * 1.20;
    return fee;
  };

  const INTERNAL_ADDRESSES = [
    { properties: { name: 'Bouganvile 1', district: 'Tamoios', street: 'Condomínio Bouganvile 1' }, geometry: { coordinates: [-42.0080, -22.6250] } },
    { properties: { name: 'Bouganvile 2', district: 'Tamoios', street: 'Condomínio Bouganvile 2' }, geometry: { coordinates: [-42.0060, -22.6270] } },
    { properties: { name: 'Bouganvile 3', district: 'Tamoios', street: 'Condomínio Bouganvile 3' }, geometry: { coordinates: [-42.0040, -22.6290] } },
    { properties: { name: 'Bouganvile 4', district: 'Tamoios', street: 'Condomínio Bouganvile 4' }, geometry: { coordinates: [-42.0020, -22.6310] } },
    { properties: { name: 'Gravatá 1', district: 'Tamoios', street: 'Condomínio Gravatá 1' }, geometry: { coordinates: [-41.9950, -22.6150] } },
    { properties: { name: 'Gravatá 2', district: 'Tamoios', street: 'Condomínio Gravatá 2' }, geometry: { coordinates: [-41.9930, -22.6130] } },
    { properties: { name: 'Condomínio Residencial Nova Califórnia', district: 'Tamoios', street: 'Condomínio Nova Califórnia' }, geometry: { coordinates: [-41.9750, -22.6050] } },
  ];

  useEffect(() => {
    const controller = new AbortController();
    const searchTimeout = setTimeout(async () => {
      const query = address.street.trim();
      const normalizedQuery = normalizeString(query);
      
      if (query.length > 2 && !isSearchingAddress) {
        const internalMatches = INTERNAL_ADDRESSES.filter(addr => 
          normalizeString(addr.properties.name).includes(normalizedQuery) ||
          normalizeString(addr.properties.street).includes(normalizedQuery)
        );

        try {
          const cleanQuery = normalizedQuery.replace(/^(rua|r\.|\d+|avenida|av\.|alameda|travessa|estrada)\s+/i, '').replace(/\d+.*$/, '').trim();
          
          let combined = [...internalMatches];
          
          if (cleanQuery) {
            const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery + " Tamoios Cabo Frio")}&limit=5&lat=${SHOP_COORDS.lat}&lon=${SHOP_COORDS.lng}`, { signal: controller.signal });
            const data = await response.json();
            if (data && data.features) {
              const apiFeatures = data.features.filter(f => f.properties.countrycode === 'BR');
              combined = [...combined, ...apiFeatures];
            }
          }
          
          // Verificar novamente se ainda não estamos selecionando antes de atualizar
          if (!isSearchingAddress) {
            setAddressSuggestions(combined.slice(0, 8));
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error("Erro na busca:", err);
            setAddressSuggestions(internalMatches);
          }
        }
      } else { setAddressSuggestions([]); }
    }, 200);

    return () => {
      clearTimeout(searchTimeout);
      controller.abort();
    };
  }, [address.street]);

  const handleSelectSuggestion = (feature) => {
    setIsSearchingAddress(true);
    setAddressSuggestions([]); // Limpar imediatamente para fechar o dropdown
    
    const [lon, lat] = feature.geometry.coordinates;
    const p = feature.properties;
    const distance = calculateDistance(SHOP_COORDS.lat, SHOP_COORDS.lng, lat, lon);
    const streetName = p.street || p.name || "";
    const fee = getCalculatedFee(distance, streetName);
    
    setDeliveryFee(fee);
    setAddress({
      ...address,
      street: streetName,
      neighborhood: p.district || p.suburb || p.locality || '',
      zipCode: p.postcode || '',
    });
    
    // Manter o bloqueio de busca por um tempo para evitar disparos do useEffect
    setTimeout(() => setIsSearchingAddress(false), 800);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return alert("Geolocalização não suportada no seu navegador.");
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const response = await fetch(`https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const p = data.features[0].properties;
          const distance = calculateDistance(SHOP_COORDS.lat, SHOP_COORDS.lng, latitude, longitude);
          const streetName = p.street || p.name || "Rua não identificada";
          const fee = getCalculatedFee(distance, streetName);
          
          setDeliveryFee(fee);
          setAddress({
            ...address,
            street: streetName,
            neighborhood: p.district || p.suburb || p.locality || 'Bairro não identificado',
            zipCode: p.postcode || '',
          });
        }
      } catch (err) {
        console.error("Erro ao obter endereço:", err);
        alert("Erro ao identificar sua localização.");
      }
    }, (err) => {
      if (err.code === 1) { // PERMISSION_DENIED
        setLocationError('denied');
      } else {
        alert("Erro ao identificar sua localização.");
      }
    });
  };

  // === CÁLCULO DE TOTAIS ===
  const categories = useMemo(() => {
    if (appMenuData && appMenuData.menu) {
      // Usar ordem personalizada se disponível
      const allCats = appMenuData.categoriesOrder || Object.keys(appMenuData.menu);
      const hidden = appMenuData.hiddenCategories || [];
      // Filtrar categorias ocultas ou inexistentes no menu
      return allCats.filter(cat => !hidden.includes(cat) && appMenuData.menu[cat]);
    }
    return [];
  }, [appMenuData]);

  const cartSubtotal = cart.reduce((acc, item) => acc + (item.totalPrice || item.price), 0);
  const hasFidelityDiscount = fidelityPoints > 0 && fidelityPoints % 6 === 5;
  const fidelityDiscountAmount = hasFidelityDiscount ? cartSubtotal * 0.3 : 0;
  const cartTotal = cartSubtotal - fidelityDiscountAmount + deliveryFee;

  // === AÇÕES DO CARRINHO ===
  const addToCart = (item, addOns = []) => {
    const itemWithAddOns = {
      ...item,
      addOns,
      totalPrice: item.price + addOns.reduce((acc, addOn) => acc + addOn.price, 0)
    };
    setCart([...cart, itemWithAddOns]);
    if (navigator.vibrate) navigator.vibrate(50); 
    setConfiguringItem(null);
    setSelectedAddOns([]);
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const scrollToCategory = (cat) => {
    setActiveCategory(cat);
    const element = document.getElementById(`category-${cat}`);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 110,
        behavior: 'smooth'
      });
    }
  };

  // === CHECKOUT FINAL ===
  const handleCheckout = async () => {
    if (cart.length === 0 || isSubmitting) return;
    
    // Anti-duplicação por tempo (5 segundos)
    const now = Date.now();
    if (now - lastCheckoutTime.current < 5000) return;
    lastCheckoutTime.current = now;

    if (!address.street || !address.number || !address.neighborhood || !address.customerName || !address.customerPhone) {
      alert("Por favor, preencha todos os seus dados e o endereço completo!");
      return;
    }

    setIsSubmitting(true);

    const todayStr = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStr);

    const nextNumber = (count || 0) + 1;
    const orderId = `#${nextNumber.toString().padStart(4, '0')}`;
    
    try {
      const { error: insertError } = await supabase
        .from('pedidos')
        .insert([{
          order_id: orderId, items: cart, subtotal: cartSubtotal,
          delivery_fee: deliveryFee, total: cartTotal, address: address,
          payment_method: paymentMethod === 'Dinheiro' && changeNeeded ? `Dinheiro (Troco para R$ ${changeNeeded})` : paymentMethod, 
          status: 'pendente'
        }]);

      if (insertError) throw insertError;

      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999, colors: ['#EC9424', '#2D1B14', '#22c55e', '#FFFFFF'] };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      // Explosão inicial épica
      confetti({
        particleCount: 400,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#EC9424', '#2D1B14', '#22c55e'],
        zIndex: 9999,
        scalar: 1.2
      });

      setIsOrderSuccess(true);
      setIsCartOpen(false);
      
      const message = `*NOVO PEDIDO MELBURGERS #${orderId}*\n\n` +
        `*Cliente:* ${address.customerName}\n` +
        `*Tel:* ${address.customerPhone}\n\n` +
        `*Items:*\n${cart.map(i => `\u2022 ${i.name}${i.addOns && i.addOns.length > 0 ? `\n   + ${i.addOns.map(a => a.name).join(', ')}` : ''}`).join('\n')}\n\n` +
        `*Subtotal:* R$ ${cartSubtotal.toFixed(2).replace('.', ',')}\n` +
        (hasFidelityDiscount ? `*Desconto Fidelidade (30%):* - R$ ${fidelityDiscountAmount.toFixed(2).replace('.', ',')}\n` : '') +
        `*Entrega:* ${deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2).replace('.', ',')}`}\n` +
        `*Total:* R$ ${cartTotal.toFixed(2).replace('.', ',')}\n` +
        `*Pagamento:* ${paymentMethod}${paymentMethod === 'Dinheiro' && changeNeeded ? ` (Troco para R$ ${changeNeeded})` : ''}\n\n` +
        `*Endereço:* ${address.street}, ${address.number}${address.complement ? ` (${address.complement})` : ''} - ${address.neighborhood}`;
      
      setTimeout(() => {
        window.location.href = `https://wa.me/5522996153138?text=${encodeURIComponent(message)}`;
      }, 3500);
      
    } catch (err) {
      alert(`ERRO AO ENVIAR PEDIDO: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchMyOrders = async () => {
    if (!address.customerPhone) return;
    setIsMyOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('address->>customerPhone', address.customerPhone)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setMyOrders(data || []);
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
    } finally {
      setIsMyOrdersLoading(false);
    }
  };

  const repeatOrder = (order) => {
    const newItems = [];
    order.items.forEach(oldItem => {
      // Tentar encontrar o item atualizado no menu
      let found = false;
      Object.keys(appMenuData.menu).forEach(cat => {
        const itemInMenu = appMenuData.menu[cat].find(i => i.name === oldItem.name);
        if (itemInMenu) {
          newItems.push(itemInMenu);
          found = true;
        }
      });
      // Se não encontrar (item deletado), adiciona o antigo mesmo
      if (!found) newItems.push(oldItem);
    });
    
    setCart([...cart, ...newItems]);
    setIsMyOrdersOpen(false);
    setIsCartOpen(true);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  useEffect(() => {
    if (isMyOrdersOpen) {
      fetchMyOrders();
      fetchFidelityPoints();
    }
  }, [isMyOrdersOpen]);

  if (isMenuLoading) return (
    <div style={{ background: '#FFFFFF', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} style={{ width: 40, height: 40, border: '3px solid #EC942422', borderTopColor: '#EC9424', borderRadius: '50%' }} />
    </div>
  );

  return (
    <div className={`app-container ${isDarkMode ? 'dark-mode' : ''}`} style={{ background: isDarkMode ? '#0C0C0E' : '#FFFFFF', transition: 'background 0.3s' }}>
      {/* 1. Banner */}
      <div className="banner-top" style={{ position: 'relative' }}>
        <img src="/images/banner-cardapio-digital.png" alt="Mel Burgers Banner" />
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{ 
            position: 'absolute', top: '24px', right: '24px', zIndex: 150, 
            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', 
            border: '1px solid rgba(255,255,255,0.2)', width: '36px', height: '36px', 
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            cursor: 'pointer', color: 'white'
          }}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <header className="insta-header">
        <div className="profile-top">
          <div className="avatar-wrapper">
            <div className="avatar-inner">
              <img src="/images/logo.png" alt="Mel Burgers Logo" />
            </div>
          </div>
          <div className="profile-title-area">
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <MoreHorizontal size={20} style={{ color: '#8e8e8e' }} />
            </div>
          </div>
        </div>
        <div className="bio-area" style={{ marginTop: '15px' }}>
          <div className="username-row" style={{ marginBottom: '4px', gap: '6px' }}>
             <h2 style={{ fontSize: '18px', fontWeight: 800, textTransform: 'uppercase' }}>melburgers</h2>
             <BadgeCheck size={18} fill="#0095f6" color="white" />
          </div>
          <div className="bio-text">
            Sabor que conquista na primeira mordida ✨ <br />
            <Truck size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> 
            Somente Delivery <br />
            <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> 
            Tamoios • Cabo Frio 🌴 <br />
            <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> 
            Seg a Seg • 19h às 01h
          </div>
        </div>
        <div className="header-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
          <a href="https://www.instagram.com/melburgerrs/" target="_blank" rel="noopener noreferrer" className="action-btn btn-primary" style={{ textDecoration: 'none', width: '100%', height: '54px', minHeight: '54px', fontSize: '15px', borderRadius: '12px', fontWeight: '800' }}>Seguir</a>
          
          <div className="quick-actions-grid">
            <div className="action-card" onClick={() => setIsMyOrdersOpen(true)}>
              <div className="action-card-icon">
                <img src="/icone_pedidos_solo.png" alt="Meus Pedidos" />
              </div>
              <div className="action-card-info">
                <h3>Meus Pedidos</h3>
                <p>Acompanhe seus pedidos e veja o histórico</p>
              </div>
              <div className="action-card-arrow">
                <ArrowRight size={14} color="#ef4444" />
              </div>
            </div>

            <div className="action-card" onClick={() => setIsCartOpen(true)}>
              <div className="action-card-icon">
                <img src="/icone_carrinho_solo.png" alt="Carrinho" />
              </div>
              <div className="action-card-info">
                <h3>Carrinho</h3>
                <p>Veja os itens adicionados e finalize seu pedido</p>
              </div>
              <div className="action-card-arrow">
                <ArrowRight size={14} color="#ef4444" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="category-nav">
        {categories.map(cat => (
          <button 
            key={cat} 
            className={`categoria-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => scrollToCategory(cat)}
          >
            {cat === 'Sobremesas' ? (
              <SobremesaHoneySVG id={cat.replace(/\s+/g, '-')} />
            ) : (
              <HoneySVG id={cat.replace(/\s+/g, '-')} />
            )}
            <span className="label">{cat}</span>
            {activeCategory === cat && (
              <motion.div 
                layoutId="active-pill-indicator"
                className="pill-neon-indicator"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        ))}
      </nav>

      <main className="menu-section">
        {categories.map(cat => (
          <section id={`category-${cat}`} key={cat} style={{ marginBottom: '48px' }}>
            <h2 className="section-title">{cat}</h2>
            <div className="items-grid">
              {(appMenuData.menu[cat] || [])
                .filter(item => !(appMenuData.hiddenItems || []).includes(item.id))
                .map((item, i) => (
                <motion.div key={i} className="menu-card" initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div className="card-info">
                    <div className="card-header"><h3>{item.name}</h3><p>{item.description}</p></div>
                    <div className="card-footer">
                      <span className="price-tag">R$ {item.price.toFixed(2).replace('.', ',')}</span>
                      <button className="add-btn" onClick={() => {
                        if (cat === 'Bebidas') {
                          addToCart(item);
                        } else {
                          setConfiguringItem({ ...item, category: cat });
                          setSelectedAddOns([]);
                        }
                      }}><Plus size={22} strokeWidth={3} /></button>
                    </div>
                  </div>
                  <div className="card-img"><img src={item.image} alt={item.name} /></div>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* 5. Floating Cart */}
      <AnimatePresence>
        {configuringItem && (
          <motion.div 
            className="cart-modal-overlay" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            style={{ zIndex: 4000 }}
            onClick={() => setConfiguringItem(null)}
          >
            <motion.div 
              className="cart-modal-content" 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              onClick={e => e.stopPropagation()}
              style={{ padding: '0', borderRadius: '24px 24px 0 0', overflow: 'hidden' }}
            >
              <div style={{ position: 'relative', height: '180px' }}>
                <img src={configuringItem.image} alt={configuringItem.name} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#f8fafc' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
                <button 
                  onClick={() => setConfiguringItem(null)}
                  style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                </button>
                <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'white', marginBottom: '2px' }}>{configuringItem.name}</h2>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineClamp: 1, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{configuringItem.description}</p>
                </div>
              </div>

              <div style={{ padding: '20px', background: isDarkMode ? '#18181b' : 'white' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', display: 'flex', justifyContent: 'space-between', color: isDarkMode ? 'white' : '#18181b' }}>
                    Turbine seu pedido
                    <span style={{ fontSize: '11px', fontWeight: 500, color: '#8e8e8e' }}>OPCIONAL</span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                    {ADD_ONS.map(addOn => {
                      const isSelected = selectedAddOns.find(a => a.id === addOn.id);
                      
                      if (addOn.id === 'piscina_cheddar') {
                        return (
                          <div 
                            key={addOn.id} 
                            onClick={() => {
                              if (isSelected) {
                                setSelectedAddOns(selectedAddOns.filter(a => a.id !== addOn.id));
                              } else {
                                setSelectedAddOns([...selectedAddOns, addOn]);
                              }
                            }}
                            style={{ 
                              position: 'relative',
                              display: 'flex', gap: '16px', alignItems: 'center',
                              padding: '16px', borderRadius: '20px', 
                              background: isDarkMode ? '#111113' : '#fcfcfd',
                              border: `2px solid ${isSelected ? '#EC9424' : (isDarkMode ? 'rgba(255,255,255,0.05)' : '#e2e8f0')}`,
                              cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: isSelected ? '0 10px 30px rgba(236,148,36,0.15)' : 'none',
                              marginTop: '8px'
                            }}
                          >
                            <div style={{ 
                              width: '80px', height: '80px', borderRadius: '16px', 
                              overflow: 'hidden', flexShrink: 0,
                              background: '#f8fafc', border: '1px solid rgba(0,0,0,0.05)'
                            }}>
                              <img src={addOn.image} alt={addOn.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            
                            <div style={{ flex: 1, zIndex: 2 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontSize: '15px', fontWeight: 800, color: isDarkMode ? 'white' : '#18181b' }}>{addOn.name}</span>
                                <span style={{ fontSize: '14px', fontWeight: 900, color: '#22c55e' }}>R$ {addOn.price.toFixed(2).replace('.', ',')}</span>
                              </div>
                              <p style={{ fontSize: '12px', color: '#8e8e8e', lineHeight: 1.4, margin: 0, maxWidth: '80%' }}>{addOn.description}</p>
                            </div>

                            {/* Animação Ultra-Realista de Cheddar (Gooey Effect + Fluid Physics) */}
                            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: '18px' }}>
                              <svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none" style={{ filter: 'url(#gooey-cheddar)' }}>
                                <defs>
                                  <filter id="gooey-cheddar">
                                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
                                  </filter>
                                  <linearGradient id="cheddar-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#FDB931" />
                                    <stop offset="100%" stopColor="#EC9424" />
                                  </linearGradient>
                                </defs>

                                {/* Massa Principal no Topo */}
                                <motion.path
                                  d="M330,0 C340,25 385,25 400,0 L400,0 L330,0 Z"
                                  fill="url(#cheddar-grad)"
                                  animate={{ 
                                    d: [
                                      "M330,0 C340,25 385,25 400,0 L400,0 L330,0 Z",
                                      "M330,0 C350,45 390,45 400,0 L400,0 L330,0 Z",
                                      "M330,0 C340,25 385,25 400,0 L400,0 L330,0 Z"
                                    ]
                                  }}
                                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                />

                                {/* Gotas com Física de Estiramento */}
                                {[0, 1.8, 3.6].map((delay, i) => (
                                  <motion.circle
                                    key={i}
                                    cx={365 + (i * 8)}
                                    cy="0"
                                    r="8"
                                    fill="url(#cheddar-grad)"
                                    initial={{ y: 0, scale: 0 }}
                                    animate={{ 
                                      y: [0, 20, 120],
                                      scale: [0, 1.2, 1, 0.8],
                                      opacity: [0, 1, 1, 0]
                                    }}
                                    transition={{ 
                                      duration: 4, 
                                      repeat: Infinity, 
                                      ease: [0.4, 0, 0.6, 1],
                                      delay: delay 
                                    }}
                                  />
                                ))}
                              </svg>
                            </div>

                            {isSelected && (
                              <motion.div 
                                initial={{ scale: 0 }} 
                                animate={{ scale: 1 }} 
                                style={{ 
                                  position: 'absolute', top: '-10px', right: '-10px', 
                                  background: '#EC9424', color: 'white', 
                                  width: '28px', height: '28px', borderRadius: '50%', 
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  boxShadow: '0 4px 12px rgba(236,148,36,0.3)',
                                  zIndex: 2
                                }}
                              >
                                <BadgeCheck size={18} />
                              </motion.div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={addOn.id} 
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAddOns(selectedAddOns.filter(a => a.id !== addOn.id));
                            } else {
                              setSelectedAddOns([...selectedAddOns, addOn]);
                            }
                          }}
                          style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                            padding: '12px', borderRadius: '14px', 
                            background: isSelected ? (isDarkMode ? 'rgba(236,148,36,0.1)' : '#fff9f2') : (isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc'),
                            border: `1px solid ${isSelected ? '#EC9424' : (isDarkMode ? 'rgba(255,255,255,0.05)' : '#e2e8f0')}`,
                            cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ 
                              width: '18px', height: '18px', borderRadius: '5px', 
                              border: `2px solid ${isSelected ? '#EC9424' : '#cbd5e1'}`, 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', 
                              background: isSelected ? '#EC9424' : 'transparent' 
                            }}>
                              {isSelected && <BadgeCheck size={12} color="white" />}
                            </div>
                            {addOn.icon && <span style={{ fontSize: '18px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>{addOn.icon}</span>}
                            <span style={{ fontSize: '13px', fontWeight: 600, color: isDarkMode ? 'white' : '#18181b' }}>{addOn.name}</span>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#22c55e' }}>+ R$ {addOn.price.toFixed(2).replace('.', ',')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button 
                  className="checkout-btn" 
                  onClick={isAddingToCart ? null : handleAnimatedAddToCart}
                  style={{ 
                    width: '100%', height: '64px', borderRadius: '24px', 
                    fontSize: '17px', fontWeight: 900,
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                    position: 'relative',
                    overflow: 'hidden',
                    background: '#EC9424',
                    color: 'white',
                    fontFamily: "'Outfit', sans-serif"
                  }}
                >
                  <AnimatePresence mode="wait">
                    {!isAddingToCart ? (
                      <motion.div
                        key="static"
                        initial={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 200 }}
                        transition={{ duration: 0.5, ease: "backIn" }}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                      >
                        <ShoppingCart size={24} strokeWidth={3} />
                        <span>Adicionar • R$ {(configuringItem.price + selectedAddOns.reduce((acc, a) => acc + a.price, 0)).toFixed(2).replace('.', ',')}</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="anim"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <motion.div
                          initial={{ x: -150, scale: 1, rotate: 0 }}
                          animate={{ 
                            x: [ -150, 0, 0, 400 ], 
                            scale: [1, 1.3, 1.3, 1],
                            rotate: [0, 0, 0, 0, -40]
                          }}
                          transition={{ 
                            times: [0, 0.15, 0.6, 0.95, 1],
                            duration: 3.0, 
                            ease: "easeInOut" 
                          }}
                          style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <div style={{ position: 'relative', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {/* SVG Customizado para preenchimento preciso */}
                            <motion.svg
                              width="36"
                              height="36"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ zIndex: 5 }}
                            >
                              <circle cx="8" cy="21" r="1" />
                              <circle cx="19" cy="21" r="1" />
                              <motion.path 
                                d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" 
                                animate={{ 
                                  fill: [ "rgba(139, 69, 19, 0)", "rgba(139, 69, 19, 0)", "rgba(139, 69, 19, 1)" ]
                                }}
                                transition={{ 
                                  delay: 0.6,
                                  times: [0, 0.6, 1],
                                  duration: 0.8,
                                  ease: "easeOut"
                                }}
                              />
                            </motion.svg>
                            
                            {/* Check no meio do carrinho - Ajustado para ser proporcional */}
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ 
                                scale: [0, 0, 1],
                                opacity: [0, 0, 1]
                              }}
                              transition={{ 
                                delay: 0.6,
                                times: [0, 0.8, 1],
                                duration: 1.2,
                                ease: "backOut"
                              }}
                              style={{ 
                                position: 'absolute', 
                                top: '8px', 
                                left: '10px', 
                                width: '20px', 
                                height: '16px', 
                                zIndex: 10, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center' 
                              }}
                            >
                              <Check size={14} color="white" strokeWidth={6} />
                            </motion.div>
                          </div>
                          
                          {/* Hamburger Saindo do Botão e DESAPARECENDO dentro do carrinho */}
                          <motion.div
                            initial={{ y: 60, opacity: 0, scale: 0.2 }}
                            animate={{ 
                              y: [60, -40, 0], 
                              opacity: [0, 1, 1, 0],
                              scale: [0.2, 1.5, 0.8, 0] 
                            }}
                            transition={{ 
                              delay: 0.6, 
                              duration: 0.8, 
                              times: [0, 0.4, 0.8, 1],
                              ease: "easeInOut"
                            }}
                            style={{ position: 'absolute', fontSize: '24px', zIndex: 6 }}
                          >
                            🍔
                          </motion.div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {cart.length > 0 && !isCartOpen && (
        <div style={{ position: 'fixed', bottom: '30px', left: 0, right: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <motion.div 
            className="cart-floating"
            style={{ pointerEvents: 'auto', position: 'relative', left: 'auto', transform: 'none', width: '95%', maxWidth: '460px' }}
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            onClick={() => setIsCartOpen(true)}
          >
            <div className="cart-count">{cart.length}</div>
            <div className="cart-view-text">Ver Carrinho</div>
            <div style={{ fontWeight: 800 }}>R$ {cartSubtotal.toFixed(2).replace('.', ',')}</div>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {locationError === 'denied' && (
          <motion.div 
            className="cart-modal-overlay" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            style={{ zIndex: 3000 }}
            onClick={() => setLocationError(null)}
          >
            <motion.div 
              className="cart-modal-content" 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              onClick={e => e.stopPropagation()}
              style={{ maxHeight: '80vh', padding: '32px' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '64px', height: '64px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <MapPin size={32} color="#ef4444" />
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '8px' }}>Localização Negada</h2>
                <p style={{ color: '#64748b', fontSize: '15px' }}>Não conseguimos acessar sua posição atual. Siga as instruções para ativar:</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                <div style={{ background: isDarkMode ? '#1a1a1c' : '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '8px', color: '#EC9424' }}>iPhone (Safari)</h3>
                  <p style={{ fontSize: '13px', lineHeight: 1.5 }}>Ajustes → Privacidade → Localização → Safari → Permita "Durante o Uso".</p>
                </div>
                <div style={{ background: isDarkMode ? '#1a1a1c' : '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '8px', color: '#EC9424' }}>Android / Chrome</h3>
                  <p style={{ fontSize: '13px', lineHeight: 1.5 }}>Clique no 🔒 cadeado ao lado do site → Configurações do site → Localização → Permitir.</p>
                </div>
              </div>

              <button 
                onClick={() => setLocationError(null)}
                style={{ width: '100%', padding: '18px', background: '#EC9424', color: 'white', border: 'none', borderRadius: '18px', fontSize: '16px', fontWeight: 900, cursor: 'pointer' }}
              >
                Entendi
              </button>
            </motion.div>
          </motion.div>
        )}

        {isCartOpen && (
          <motion.div className="cart-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)}>
            <motion.div className="cart-modal-content" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 900 }}>Seu Carrinho</h2>
                <button onClick={() => setIsCartOpen(false)} style={{ background: isDarkMode ? '#2A2A2E' : '#f5f5f7', color: 'var(--text)', border: 'none', padding: '10px', borderRadius: '50%' }}><ChevronDown size={24}/></button>
              </div>

              {checkoutStep === 'cart' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '35px' }}>
                    {cart.map((item, i) => (
                      <div key={i} className="cart-item" style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '12px', borderRadius: '18px' }}>
                        <img src={item.image} alt={item.name} style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'contain', background: '#f8fafc' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '15px', fontWeight: 700 }}>{item.name}</div>
                          {item.addOns && item.addOns.length > 0 && (
                            <div style={{ fontSize: '11px', color: '#EC9424', fontWeight: 600 }}>
                              + {item.addOns.map(a => a.name).join(', ')}
                            </div>
                          )}
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#22c55e', marginTop: '2px' }}>R$ {(item.totalPrice || item.price).toFixed(2).replace('.', ',')}</div>
                        </div>
                        <button onClick={() => removeFromCart(i)} style={{ background: '#fff0f0', border: 'none', padding: '8px', borderRadius: '10px', color: '#f43f5e' }}><Trash2 size={18}/></button>
                      </div>
                    ))}
                  </div>
                  <button className="checkout-btn" onClick={() => setCheckoutStep('address')}>CONTINUAR PARA ENTREGA</button>
                </>
              )}

              {checkoutStep === 'address' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ background: isDarkMode ? '#18181B' : '#FFFFFF', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><UserPlus size={18} color="#EC9424" /><span style={{ fontSize: '14px', fontWeight: 700 }}>Seus Dados</span></div>
                     <input style={{ width: '100%', background: 'var(--card-bg)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'var(--text)', marginBottom: '12px' }} placeholder="Seu Nome Completo" value={address.customerName} onChange={e => setAddress({...address, customerName: e.target.value})} />
                     <input style={{ width: '100%', background: 'var(--card-bg)', border: '1px solid var(--border)', padding: '14px', borderRadius: '14px', color: 'var(--text)' }} placeholder="WhatsApp" value={address.customerPhone} onChange={e => setAddress({...address, customerPhone: e.target.value})} />
                  </div>
                  <div style={{ background: isDarkMode ? '#18181B' : '#FFFFFF', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <MapPin size={18} color="#EC9424" />
                         <span style={{ fontSize: '14px', fontWeight: 700 }}>Endereço</span>
                       </div>
                       <button 
                         onClick={handleUseCurrentLocation}
                         style={{ 
                           background: isDarkMode ? 'rgba(236,148,36,0.1)' : 'rgba(236,148,36,0.05)', 
                           backdropFilter: 'blur(10px)',
                           border: `1px solid ${isDarkMode ? 'rgba(236,148,36,0.2)' : 'rgba(236,148,36,0.15)'}`, 
                           padding: '8px 14px', borderRadius: '12px', 
                           color: '#EC9424', fontSize: '10px', fontWeight: 900, 
                           display: 'flex', alignItems: 'center', gap: '6px',
                           letterSpacing: '0.05em',
                           boxShadow: '0 2px 10px rgba(236,148,36,0.08)',
                           transition: 'all 0.3s ease'
                         }}
                       >
                         <MapPin size={12} fill="#EC9424" strokeWidth={3} />
                         LOCALIZAÇÃO ATUAL
                       </button>
                     </div>
                      <div style={{ position: 'relative' }}>
                        <input style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)', padding: '14px', borderRadius: '14px' }} placeholder="Nome da rua..." value={address.street} onChange={e => setAddress({...address, street: e.target.value})} />
                        {addressSuggestions.length > 0 && (
                          <div style={{ 
                            position: 'absolute', 
                            top: '58px', 
                            bottom: 'auto',
                            left: 0, 
                            right: 0, 
                            background: 'var(--card-bg)', 
                            borderRadius: '16px', 
                            boxShadow: '0 12px 40px rgba(0,0,0,0.15)', 
                            zIndex: 3500, 
                            marginTop: '8px',
                            maxHeight: '220px',
                            overflowY: 'auto',
                            border: '1px solid var(--border)',
                            overflow: 'hidden'
                          }} className="hide-scrollbar">
                            {addressSuggestions.map((f, i) => (
                              <div 
                                key={i} 
                                onPointerDown={(e) => {
                                   e.preventDefault(); 
                                   handleSelectSuggestion(f);
                                }} 
                                style={{ 
                                  padding: '14px 18px', 
                                  fontSize: '13px', 
                                  borderBottom: i === addressSuggestions.length - 1 ? 'none' : '1px solid var(--border)', 
                                  cursor: 'pointer',
                                  color: 'var(--text)',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'rgba(236,148,36,0.05)'}
                                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                              >
                                {f.properties.street || f.properties.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                     <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                        <input style={{ flex: 1, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)', padding: '12px', borderRadius: '12px' }} placeholder="Nº" value={address.number} onChange={e => setAddress({...address, number: e.target.value})} />
                        <input style={{ flex: 2, border: '1px solid var(--border)', background: isDarkMode ? '#121215' : '#fcfcfd', color: 'var(--text)', padding: '12px', borderRadius: '12px' }} placeholder="Bairro" value={address.neighborhood} readOnly />
                     </div>
                     <div style={{ marginTop: '12px' }}>
                        <input style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)', padding: '12px', borderRadius: '12px' }} placeholder="Complemento / Referência (opcional)" value={address.complement} onChange={e => setAddress({...address, complement: e.target.value})} />
                     </div>
                  </div>
                  <button className="checkout-btn" onClick={() => { if(!address.customerName || !address.customerPhone || !address.street || !address.number) return alert("Preencha tudo!"); fetchFidelityPoints(); setCheckoutStep('payment'); }}>IR PARA PAGAMENTO</button>
                  <button onClick={() => setCheckoutStep('cart')} style={{ background: 'none', border: 'none', color: '#71717A', fontSize: '13px' }}>Voltar ao carrinho</button>
                </div>
              )}

              {checkoutStep === 'payment' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <FidelityCard fidelityPoints={fidelityPoints} address={address} isDarkMode={isDarkMode} />
                  
                  <div style={{ background: isDarkMode ? '#18181B' : '#FFFFFF', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}><ShoppingCart size={18} color="#EC9424" /><span style={{ fontSize: '14px', fontWeight: 700 }}>Pagamento</span></div>
                     <div style={{ display: 'flex', gap: '10px' }}>
                        {['PIX', 'Cartão', 'Dinheiro'].map(m => (
                          <button key={m} onClick={() => setPaymentMethod(m)} style={{ flex: 1, padding: '16px 5px', borderRadius: '16px', border: `2px solid ${paymentMethod === m ? '#EC9424' : 'var(--border)'}`, background: 'var(--card-bg)', color: paymentMethod === m ? '#EC9424' : 'var(--text-light)', fontWeight: 800 }}>{m}</button>
                        ))}
                     </div>
                  </div>
                  
                  {paymentMethod === 'PIX' && <div style={{ padding: '24px', background: isDarkMode ? 'rgba(34,197,94,0.1)' : '#f0fdf4', borderRadius: '20px', border: '2px dashed #22c55e', textAlign: 'center' }}>
                     <div style={{ color: '#22c55e', fontWeight: 800, fontSize: '12px', marginBottom: '8px' }}>CHAVE PIX CNPJ</div>
                     <div style={{ fontSize: '17px', fontWeight: 900, marginBottom: '16px' }}>64.745.137/0001-58</div>
                     <button onClick={() => { navigator.clipboard.writeText("64745137000158"); alert("Copiado!"); }} style={{ width: '100%', padding: '14px', background: 'white', border: '1.5px solid #22c55e', borderRadius: '14px', color: '#22c55e', fontWeight: 900 }}>COPIAR CHAVE</button>
                  </div>}
                  
                  {paymentMethod === 'Dinheiro' && <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                     <label style={{ fontSize: '13px', fontWeight: 800, display: 'block', marginBottom: '10px' }}>Troco para quanto?</label>
                     <input style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }} placeholder="Ex: 50,00" value={changeNeeded} onChange={e => setChangeNeeded(e.target.value)} />
                  </div>}

                  <div style={{ padding: '24px 4px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ color: '#71717A' }}>Produtos</span><span style={{ fontWeight: 800 }}>R$ {cartSubtotal.toFixed(2).replace('.', ',')}</span></div>
                    
                    {hasFidelityDiscount && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#22c55e', fontWeight: 800 }}>
                        <span>Desconto Fidelidade (30%)</span>
                        <span>- R$ {fidelityDiscountAmount.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}><span style={{ color: '#71717A' }}>Entrega</span><span style={{ fontWeight: 800, color: '#22c55e' }}>{deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2).replace('.', ',')}`}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '24px', fontWeight: 950 }}><span>Total</span><span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span></div>
                  </div>
                  <button className="checkout-btn" onClick={handleCheckout} style={{ height: '70px', borderRadius: '24px' }}>FINALIZAR PEDIDO</button>
                  <button onClick={() => setCheckoutStep('address')} style={{ background: 'none', border: 'none', color: '#71717A', fontSize: '13px', marginTop: '10px' }}>Voltar ao endereço</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOrderSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <CheckCircle2 size={80} color="#22c55e" style={{ margin: '0 auto 20px' }} />
              <h1 style={{ fontWeight: 900, fontSize: '24px', color: 'var(--text)' }}>Pedido Enviado!</h1>
              <p style={{ color: 'var(--text-light)' }}>Redirecionando para o WhatsApp...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. My Orders Modal */}
      <AnimatePresence>
        {isMyOrdersOpen && (
          <div className="cart-modal-overlay" onClick={() => setIsMyOrdersOpen(false)}>
            <motion.div 
              className="cart-modal-content" 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              onClick={e => e.stopPropagation()}
              style={{ background: isDarkMode ? '#0C0C0E' : '#FFFFFF' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 950 }}>MEUS PEDIDOS</h2>
                <button onClick={() => setIsMyOrdersOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-light)' }}>
                   <ChevronDown size={24} />
                </button>
              </div>

              {address.customerPhone && (
                <div style={{ marginBottom: '20px' }}>
                  <FidelityCard fidelityPoints={fidelityPoints} address={address} isDarkMode={isDarkMode} />
                </div>
              )}

              {!address.customerPhone ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ color: 'var(--text-light)', marginBottom: '20px' }}>Faça seu primeiro pedido para ver seu histórico aqui!</p>
                </div>
              ) : isMyOrdersLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 30, height: 30, border: '3px solid #EC942422', borderTopColor: '#EC9424', borderRadius: '50%' }} />
                </div>
              ) : myOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ color: 'var(--text-light)' }}>Nenhum pedido encontrado para o número {address.customerPhone}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {myOrders.map((order, idx) => (
                    <div key={idx} style={{ background: isDarkMode ? '#18181B' : '#F9F9F9', padding: '20px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontWeight: 800, fontSize: '14px', color: '#EC9424' }}>{order.order_id}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        {order.items.map((item, i) => (
                          <div key={i} style={{ fontSize: '13px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700 }}>{item.quantity || 1}x</span> {item.name}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 900 }}>R$ {order.total.toFixed(2).replace('.', ',')}</span>
                        <button 
                          onClick={() => repeatOrder(order)}
                          style={{ 
                            background: '#EC9424', color: 'white', border: 'none', 
                            padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 900,
                            display: 'flex', alignItems: 'center', gap: '6px'
                          }}
                        >
                          <Plus size={14} strokeWidth={3} /> REPETIR
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
