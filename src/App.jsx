import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Clock, ArrowRight, MapPin, Sun, Moon,
  BadgeCheck, ShoppingBag, Truck, ShoppingCart,
  Trash2, ChevronDown, CheckCircle2, MoreHorizontal, UserPlus
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

const App = () => {
  const [appMenuData, setAppMenuData] = useState(getMenuData());
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [address, setAddress] = useState(() => {
    const saved = localStorage.getItem('melburguers_customer_data');
    return saved ? JSON.parse(saved) : {
      street: '', number: '', neighborhood: '', complement: '', zipCode: '', customerName: '', customerPhone: '',
    };
  });
  const [deliveryFee, setDeliveryFee] = useState(() => {
    const saved = localStorage.getItem('melburguers_delivery_fee');
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
    return localStorage.getItem('melburguers_theme') === 'dark';
  });
  const [locationError, setLocationError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastCheckoutTime = useRef(0);

  // === PERSISTÊNCIA DE DADOS ===
  useEffect(() => {
    localStorage.setItem('melburguers_customer_data', JSON.stringify(address));
  }, [address]);

  useEffect(() => {
    localStorage.setItem('melburguers_delivery_fee', deliveryFee.toString());
  }, [deliveryFee]);

  useEffect(() => {
    localStorage.setItem('melburguers_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // === CARREGAMENTO INICIAL ===
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const { data } = await supabase.from('menu_config').select('data').eq('id', 1).single();
        if (data) {
          setAppMenuData(data.data);
          const cats = Object.keys(data.data.menu);
          if (cats.length > 0) setActiveCategory(cats[0]);
        }
      } catch (err) {
        console.error("Erro ao carregar menu:", err);
      } finally {
        setIsMenuLoading(false);
      }
    };
    fetchMenu();
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
    if (appMenuData && appMenuData.menu) return Object.keys(appMenuData.menu);
    return [];
  }, [appMenuData]);

  const cartSubtotal = cart.reduce((acc, item) => acc + item.price, 0);
  const cartTotal = cartSubtotal + deliveryFee;

  // === AÇÕES DO CARRINHO ===
  const addToCart = (item) => {
    setCart([...cart, item]);
    if (navigator.vibrate) navigator.vibrate(50); 
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
      
      const message = `*NOVO PEDIDO MELBURGUERS #${orderId}*\n\n*Cliente:* ${address.customerName}\n*Tel:* ${address.customerPhone}\n\n*Items:*\n${cart.map(i => `\u2022 ${i.name}`).join('\n')}\n\n*Total:* R$ ${cartTotal.toFixed(2).replace('.', ',')}\n*Pagamento:* ${paymentMethod}${paymentMethod === 'Dinheiro' && changeNeeded ? ` (Troco para R$ ${changeNeeded})` : ''}\n\n*Endereço:* ${address.street}, ${address.number}${address.complement ? ` (${address.complement})` : ''} - ${address.neighborhood}`;
      
      setTimeout(() => {
        window.location.href = `https://wa.me/5522996153138?text=${encodeURIComponent(message)}`;
      }, 3500);
      
    } catch (err) {
      alert(`ERRO AO ENVIAR PEDIDO: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isMenuLoading) return (
    <div style={{ background: '#FFFFFF', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} style={{ width: 40, height: 40, border: '3px solid #EC942422', borderTopColor: '#EC9424', borderRadius: '50%' }} />
    </div>
  );

  return (
    <div className="app-container" style={{ background: isDarkMode ? '#0C0C0E' : '#FFFFFF', transition: 'background 0.3s' }}>
      {/* 1. Banner */}
      <div className="banner-top" style={{ position: 'relative' }}>
        <img src="/images/MEL Burgers iluminado e convidativo.png" alt="Mel Burgers Banner" />
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
            <div className="username-row">
              <h2>melburguers</h2>
              <BadgeCheck size={20} fill="#0095f6" color="white" />
              <MoreHorizontal size={20} style={{ marginLeft: 'auto', color: '#8e8e8e' }} />
            </div>
          </div>
        </div>
        <div className="bio-area">
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
        <div className="header-actions">
          <a href="https://www.instagram.com/melburgerrs/" target="_blank" rel="noopener noreferrer" className="action-btn btn-primary" style={{ textDecoration: 'none' }}>Seguir</a>
          <button className="action-btn btn-secondary btn-icon" onClick={() => setIsCartOpen(true)}>
            <ShoppingCart size={20} />
          </button>
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
          </button>
        ))}
      </nav>

      <main className="menu-section">
        {categories.map(cat => (
          <section id={`category-${cat}`} key={cat} style={{ marginBottom: '48px' }}>
            <h2 className="section-title">{cat}</h2>
            <div className="items-grid">
              {appMenuData.menu[cat].map((item, i) => (
                <motion.div key={i} className="menu-card" initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div className="card-info">
                    <div className="card-header"><h3>{item.name}</h3><p>{item.description}</p></div>
                    <div className="card-footer">
                      <span className="price-tag">R$ {item.price.toFixed(2).replace('.', ',')}</span>
                      <button className="add-btn" onClick={() => addToCart(item)}><Plus size={22} strokeWidth={3} /></button>
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
                        <img src={item.image} alt={item.name} style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '15px', fontWeight: 700 }}>{item.name}</div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#22c55e', marginTop: '2px' }}>R$ {item.price.toFixed(2).replace('.', ',')}</div>
                        </div>
                        <button onClick={() => removeFromCart(i)} style={{ background: '#fff0f0', border: 'none', padding: '8px', borderRadius: '10px', color: '#f43f5e' }}><Trash2 size={18}/></button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setCheckoutStep('address')} style={{ width: '100%', height: '62px', background: '#EC9424', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 900 }}>CONTINUAR PARA ENTREGA</button>
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
                  <button onClick={() => { if(!address.customerName || !address.customerPhone || !address.street || !address.number) return alert("Preencha tudo!"); setCheckoutStep('payment'); }} style={{ width: '100%', height: '62px', background: '#EC9424', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 900 }}>IR PARA PAGAMENTO</button>
                  <button onClick={() => setCheckoutStep('cart')} style={{ background: 'none', border: 'none', color: '#71717A', fontSize: '13px' }}>Voltar ao carrinho</button>
                </div>
              )}

              {checkoutStep === 'payment' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}><span style={{ color: '#71717A' }}>Entrega</span><span style={{ fontWeight: 800, color: '#22c55e' }}>{deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2).replace('.', ',')}`}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '24px', fontWeight: 950 }}><span>Total</span><span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span></div>
                  </div>
                  <button onClick={handleCheckout} style={{ width: '100%', height: '70px', background: '#EC9424', color: 'white', border: 'none', borderRadius: '24px', fontWeight: 900 }}>FINALIZAR PEDIDO</button>
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
    </div>
  );
};

export default App;
