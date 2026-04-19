import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Clock, Star, ArrowRight, Home, 
  BadgeCheck, MapPin, Search, Heart, Share2,
  ChevronDown, CheckCircle2, ChevronLeft,
  ShoppingCart, Trash2, Info, UserPlus,
  Moon, Sun, Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { supabase } from './utils/supabase';
import { getMenuData } from './utils/menuStore';

// === CONFIGURAÇÃO DE TEMAS (PALETA MELBURGUERS PREMIUM) ===
const lightTheme = {
  primary: '#EC9424',        
  background: '#F8F8FA',    
  surface: '#FFFFFF',       
  textZinc: '#18181B',      
  textMuted: '#71717A',     
  green: '#22c55e',         
  red: '#f43f5e',           
  accent: '#FDF2E9',        
  border: '#E2E2E7',
  cardBg: '#FFFFFF',
  isDark: false
};

const darkTheme = {
  primary: '#EC9424',       
  background: '#0C0C0E',    
  surface: '#121215',       
  textZinc: '#F8F8FA',      
  textMuted: '#94949E',     
  green: '#4ade80',         
  red: '#fb7185',           
  accent: 'rgba(236, 148, 36, 0.15)',        
  border: '#2A2A2E',
  cardBg: '#18181B',
  isDark: true
};

const App = () => {
  const [appMenuData, setAppMenuData] = useState(getMenuData());
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [address, setAddress] = useState({
    street: '', number: '', neighborhood: '', complement: '', zipCode: '', customerName: '', customerPhone: '',
  });
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [changeNeeded, setChangeNeeded] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = isDarkMode ? darkTheme : lightTheme;

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

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      const query = address.street.trim();
      if (query.length > 3 && !isSearchingAddress) {
        try {
          const cleanQuery = query.toLowerCase().replace(/^(rua|r\.|avenida|av\.|alameda|travessa|estrada)\s+/i, '').replace(/\d+.*$/, '').trim();
          if (!cleanQuery) return;
          const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery + " Tamoios Cabo Frio")}&limit=5&lat=${SHOP_COORDS.lat}&lon=${SHOP_COORDS.lng}`);
          const data = await response.json();
          if (data && data.features) setAddressSuggestions(data.features.filter(f => f.properties.countrycode === 'BR'));
        } catch (err) { console.error("Erro na busca:", err); }
      } else { setAddressSuggestions([]); }
    }, 200);
    return () => clearTimeout(searchTimeout);
  }, [address.street]);

  const handleSelectSuggestion = (feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    const p = feature.properties;
    const distance = calculateDistance(SHOP_COORDS.lat, SHOP_COORDS.lng, lat, lon);
    const streetName = p.street || p.name || "";
    const fee = getCalculatedFee(distance, streetName);
    
    setDeliveryFee(fee);
    setIsSearchingAddress(true);
    setAddress({
      ...address,
      street: streetName,
      neighborhood: p.district || p.suburb || p.locality || '',
      zipCode: p.postcode || '',
    });
    setAddressSuggestions([]);
    setTimeout(() => setIsSearchingAddress(false), 400);
  };

  // === EFEITO DE ROLAGEM PARA O HEADER ===
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    if (cart.length === 0) return;
    if (!address.street || !address.number || !address.neighborhood || !address.customerName || !address.customerPhone) {
      alert("Por favor, preencha todos os seus dados e o endereço completo!");
      return;
    }

    const orderId = Math.random().toString(36).substr(2, 5).toUpperCase();
    
    try {
      console.log('📤 Iniciando envio do pedido:', orderId);
      
      const { error: insertError } = await supabase
        .from('pedidos')
        .insert([{
          order_id: orderId, 
          items: cart, 
          subtotal: cartSubtotal,
          delivery_fee: deliveryFee, 
          total: cartTotal, 
          address: address,
          payment_method: paymentMethod === 'Dinheiro' && changeNeeded 
            ? `Dinheiro (Troco para R$ ${changeNeeded})` 
            : paymentMethod, 
          status: 'pendente'
        }]);

      if (insertError) {
        console.error('❌ Erro Supabase:', insertError);
        throw insertError;
      }

      console.log('✅ Pedido salvo no banco com sucesso!');

      confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.6 },
        zIndex: 4000,
        colors: [theme.primary, '#2D1B14', theme.green]
      });

      setIsOrderSuccess(true);
      setIsCartOpen(false);
      
      const message = `*NOVO PEDIDO MELBURGUERS #${orderId}*\n\n*Cliente:* ${address.customerName}\n*Tel:* ${address.customerPhone}\n\n*Items:*\n${cart.map(i => `\u2022 ${i.name}`).join('\n')}\n\n*Total:* R$ ${cartTotal.toFixed(2)}\n*Pagamento:* ${paymentMethod}${paymentMethod === 'Dinheiro' && changeNeeded ? ` (Troco para R$ ${changeNeeded})` : ''}\n\n*Endereço:* ${address.street}, ${address.number} - ${address.neighborhood}`;
      
      // Enviamos pro WhatsApp via location.href para evitar bloqueios de pop-up
      setTimeout(() => {
        window.location.href = `https://wa.me/5522996153138?text=${encodeURIComponent(message)}`;
      }, 3500);
      
    } catch (err) {
      console.error('Erro fatal no checkout:', err);
      const errorMsg = err.message || "Erro desconhecido";
      alert(`ERRO NO BANCO DE DADOS: ${errorMsg}\n\nPor favor, tire um print desta tela e me envie!`);
    }
  };

  if (isMenuLoading) return (
    <div style={{ background: theme.background, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} 
        style={{ width: 40, height: 40, border: `3px solid ${theme.primary}22`, borderTopColor: theme.primary, borderRadius: '50%' }} 
      />
    </div>
  );

  return (
    <div style={{ background: theme.background, minHeight: '100vh', display: 'flex', justifyContent: 'center', transition: 'background 0.3s ease' }}>
      <div style={{ width: '100%', maxWidth: '500px', background: theme.surface, minHeight: '100vh', position: 'relative', boxShadow: isDarkMode ? '0 0 80px rgba(0,0,0,0.4)' : '0 0 80px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', transition: 'background 0.3s ease' }}>
        <div style={{ flex: 1, fontFamily: "'Inter', sans-serif", paddingBottom: '120px' }}>
      
      {/* 1. HERO / HEADER (ESTILO CLÁSSICO) */}
      <div style={{ position: 'relative', height: '240px', background: '#000', overflow: 'visible' }}>
        <img 
          src="/images/MEL Burgers iluminado e convidativo.png" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
          alt="Banner Principal"
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 50%, rgba(0,0,0,0.4) 100%)' }} />
        
        {/* BADGE DE STATUS NO BANNER */}
        <div style={{ 
          position: 'absolute', top: '50px', left: '20px', 
          textAlign: 'left', pointerEvents: 'none' 
        }}>
          <h2 style={{ color: '#fff', fontSize: '26px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '1px' }}>ESTAMOS ABERTOS!</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: '700' }}>ABERTO DAS 19H ATÉ 1H PARA FAZER SEU PEDIDO</p>
        </div>

        {/* LOGO CIRCULAR GIGANTE (Efeito Honey Float) */}
        <div style={{ 
          position: 'absolute', bottom: '-40px', left: '25px', 
          zIndex: 150, padding: '5px', background: 'white', borderRadius: '50%',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)' 
        }}>
          <div style={{ position: 'relative', width: '130px', height: '130px', borderRadius: '50%', overflow: 'hidden', border: '5px solid #fff' }}>
             <img src="/images/logo.png" alt="Melburguers Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
             {/* Overlay de Mel escorrendo na borda do Logo */}
             <div style={{ 
               position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', 
               backgroundImage: "url('/images/honey-frame.png')", backgroundSize: '100% 100%' 
             }} />
          </div>
        </div>

        {/* BOTÃO DARK MODE TOGGLE (Ajustado) */}
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{ 
            position: 'absolute', top: '24px', right: '24px', zIndex: 150, 
            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', 
            border: '1px solid rgba(255,255,255,0.2)', width: '40px', height: '40px', 
            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            cursor: 'pointer', color: 'white'
          }}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* 2. INFORMAÇÕES DA LOJA (ESTILO SOCIAL) */}
      <div style={{ padding: '60px 24px 0', background: theme.surface }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: theme.textZinc, textTransform: 'uppercase' }}>Melburguers</h1>
            <BadgeCheck size={18} fill="#0095f6" color="white" />
         </div>
         <p style={{ color: theme.textMuted, fontSize: '15px', marginBottom: '20px', fontWeight: 500 }}>Sabor que conquista na primeira mordida ✨</p>
         
         <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.textZinc, fontSize: '14px', fontWeight: 600 }}>
               <Truck size={16} /> Somente Delivery
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.textZinc, fontSize: '14px', fontWeight: 600 }}>
               <MapPin size={16} /> Tamoios • Cabo Frio 🌴
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.textZinc, fontSize: '14px', fontWeight: 600 }}>
               <Clock size={16} /> Seg a Seg • 19h às 01h
            </div>
         </div>

         {/* BOTÃO SEGUIR (ESTILO INSTAGRAM) */}
         <button style={{ 
           width: '100%', height: '52px', background: '#0095f6', color: 'white', 
           border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '15px',
           marginBottom: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
         }}>
           Seguir
         </button>
      </div>

      {/* 3. CATEGORIAS (ESTILO HONEY RETRO) */}
      <div style={{ 
        position: 'sticky', top: 0, zIndex: 120, 
        background: scrolled ? (isDarkMode ? 'rgba(12,12,14,0.95)' : 'rgba(255,255,255,0.98)') : theme.surface, 
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        padding: '10px 0',
        borderBottom: scrolled ? `1px solid ${theme.border}` : 'none',
        transition: 'all 0.3s'
      }}>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '15px 20px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
           <style>
             {`
               .category-btn-honey {
                  position: relative;
                  min-width: 110px;
                  height: 44px;
                  border-radius: 22px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                  border: 1.5px solid #EC9424 !important;
                  font-size: 14px;
                  font-weight: 800;
                  text-transform: capitalize;
               }
               .honey-drip {
                  position: absolute;
                  top: -14px; 
                  left: -2px;
                  right: -2px;
                  height: 32px; 
                  background-image: url('/images/honey-frame.png');
                  background-size: 100% 100%;
                  background-repeat: no-repeat;
                  z-index: 100;
                  pointer-events: none;
               }
             `}
           </style>
           {categories.map(cat => (
             <button 
               key={cat} 
               onClick={() => scrollToCategory(cat)}
               className="category-btn-honey"
               style={{ 
                 background: activeCategory === cat ? '#EC9424' : 'transparent', 
                 color: activeCategory === cat ? 'white' : '#EC9424',
                 boxShadow: activeCategory === cat ? '0 8px 20px rgba(236,148,36,0.25)' : 'none',
                 transform: activeCategory === cat ? 'scale(1.05)' : 'scale(1)'
               }}
             >
               <div className="honey-drip"></div>
               <span style={{ position: 'relative', zIndex: 110 }}>{cat}</span>
             </button>
           ))}
        </div>
      </div>

      {/* 4. OFERTAS */}
      <div style={{ padding: '32px 20px 0' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '19px', fontWeight: 900, color: theme.textZinc, letterSpacing: '-0.3px' }}>Famosos do Melburguers</h2>
            <ArrowRight size={20} color={theme.primary} />
         </div>
         <div style={{ display: 'flex', gap: '18px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'none' }}>
            {appMenuData.menu[categories[0]]?.slice(0, 4).map((item, i) => (
              <motion.div 
                key={i}
                whileTap={{ scale: 0.96 }}
                style={{ flex: '0 0 170px', borderRadius: '24px', overflow: 'hidden', position: 'relative' }}
              >
                 <div style={{ height: '170px', width: '100%', borderRadius: '24px', overflow: 'hidden', position: 'relative' }}>
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <motion.div 
                       whileTap={{ scale: 1.2 }}
                       onClick={() => addToCart(item)}
                       style={{ position: 'absolute', bottom: '12px', right: '12px', background: theme.surface, borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 15px rgba(0,0,0,0.2)' }} 
                    >
                       <Plus size={22} color={theme.primary} strokeWidth={3} />
                    </motion.div>
                 </div>
                 <div style={{ padding: '10px 4px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: theme.textZinc }}>{item.name}</div>
                    <div style={{ color: theme.green, fontWeight: 900, fontSize: '15px', marginTop: '4px' }}>R$ {item.price.toFixed(2)}</div>
                 </div>
              </motion.div>
            ))}
         </div>
      </div>

      {/* 5. LISTAGEM DE PRODUTOS */}
      <div style={{ maxWidth: '640px', margin: '40px auto 0', padding: '0 20px' }}>
         {categories.map(cat => (
           <section id={`category-${cat}`} key={cat} style={{ marginBottom: '48px' }}>
              <h2 style={{ fontSize: '19px', fontWeight: 900, color: theme.textZinc, marginBottom: '24px', borderLeft: `5px solid ${theme.primary}`, paddingLeft: '14px' }}>{cat}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 {appMenuData.menu[cat].map((item, i) => (
                   <motion.div 
                     key={i}
                     initial={{ opacity: 0, y: 15 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     style={{ 
                       background: theme.cardBg, borderRadius: '24px', padding: '18px', 
                       display: 'flex', gap: '20px', alignItems: 'center',
                       border: isDarkMode ? `1px solid ${theme.border}` : '1px solid rgba(0,0,0,0.02)', 
                       boxShadow: isDarkMode ? '0 10px 30px rgba(0,0,0,0.3)' : '0 6px 20px rgba(0,0,0,0.02)',
                       transition: 'all 0.3s'
                     }}
                   >
                     <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: theme.textZinc, marginBottom: '4px' }}>{item.name}</span>
                        <div style={{ fontSize: '12.5px', color: theme.textMuted, lineHeight: '1.5', marginBottom: '16px' }}>{item.description}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <span style={{ fontSize: '16px', fontWeight: 900, color: theme.green }}>R$ {item.price.toFixed(2)}</span>
                           <motion.button 
                              whileTap={{ scale: 0.9 }}
                              onClick={() => addToCart(item)}
                              style={{ background: theme.accent, border: 'none', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                           >
                              <Plus size={22} color={theme.primary} strokeWidth={3} />
                           </motion.button>
                        </div>
                     </div>
                     <div style={{ width: '110px', height: '110px', borderRadius: '20px', overflow: 'hidden' }}>
                        <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     </div>
                   </motion.div>
                 ))}
              </div>
           </section>
         ))}
      </div>

      {/* 6. CARRINHO FLUTUANTE ULTRA-PREMIUM */}
      <AnimatePresence>
        {cart.length > 0 && !isCartOpen && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 100, opacity: 0 }}
            style={{ 
              position: 'fixed', 
              bottom: '32px', 
              left: '20px', 
              right: '20px', 
              zIndex: 1000, 
              display: 'flex', 
              justifyContent: 'center' 
            }}
          >
             <motion.button 
               whileHover={{ backgroundColor: isDarkMode ? '#252529' : '#16161D' }}
               whileTap={{ scale: 0.97 }}
               onClick={() => setIsCartOpen(true)}
               style={{ 
                  background: isDarkMode ? '#1A1A1E' : '#0B0B0F', 
                  color: 'rgba(255,255,255,0.95)', 
                  border: isDarkMode ? `1px solid ${theme.primary}44` : '1px solid rgba(255,255,255,0.08)', 
                  height: '64px', 
                  width: '100%', 
                  maxWidth: '480px', 
                  borderRadius: '100px',
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '0 28px', 
                  boxShadow: isDarkMode ? '0 20px 60px rgba(0,0,0,0.6)' : '0 25px 50px -12px rgba(0,0,0,0.5)',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s'
               }}
             >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', width: '36px', height: '36px', borderRadius: '50%', marginRight: '16px' }}>
                   <ShoppingCart size={18} strokeWidth={1.5} />
                </div>
                
                <div style={{ flex: 1, textAlign: 'center', fontWeight: 500, fontSize: '12px', letterSpacing: '1.2px', textTransform: 'uppercase', opacity: 0.9 }}>
                   Ver Carrinho
                </div>
                
                <div style={{ fontWeight: 600, fontSize: '15px', paddingLeft: '16px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                   R$ {cartSubtotal.toFixed(2)}
                </div>
             </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. MODAL DE FINALIZAÇÃO */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
            onClick={() => setIsCartOpen(false)}
          >
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              style={{ width: '100%', maxWidth: '540px', background: theme.surface, borderRadius: '35px 35px 0 0', padding: '35px 24px', maxHeight: '92vh', overflowY: 'auto', transition: 'background 0.3s ease' }}
              onClick={e => e.stopPropagation()}
            >
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 900, color: theme.textZinc }}>Seu Carrinho</h2>
                  <button onClick={() => setIsCartOpen(false)} style={{ background: theme.isDark ? '#2A2A2E' : '#f5f5f7', border: 'none', padding: '10px', borderRadius: '50%', color: theme.textZinc }}><ChevronDown size={24}/></button>
               </div>

               {checkoutStep === 'cart' && (
                 <>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '35px' }}>
                      {cart.map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'center', background: theme.cardBg, padding: '12px', borderRadius: '18px', border: `1px solid ${theme.border}` }}>
                           <img src={item.image} alt={item.name} style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover' }} />
                           <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '15px', fontWeight: 700, color: theme.textZinc }}>{item.name}</div>
                              <div style={{ fontSize: '13px', fontWeight: 800, color: theme.green, marginTop: '2px' }}>R$ {item.price.toFixed(2)}</div>
                           </div>
                           <button onClick={() => removeFromCart(i)} style={{ background: theme.isDark ? 'rgba(244,63,94,0.1)' : '#fff0f0', border: 'none', padding: '8px', borderRadius: '10px', color: theme.red, cursor: 'pointer' }}><Trash2 size={18}/></button>
                        </div>
                      ))}
                   </div>
                   <button 
                     onClick={() => setCheckoutStep('address')}
                      style={{ width: '100%', height: '62px', background: theme.primary, color: 'white', border: 'none', borderRadius: '20px', fontWeight: 900, fontSize: '15px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                   >
                     CONTINUAR PARA ENTREGA
                   </button>
                 </>
               )}

               {checkoutStep === 'address' && (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: theme.cardBg, padding: '20px', borderRadius: '24px', border: `1px solid ${theme.border}` }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                          <UserPlus size={18} color={theme.primary} />
                          <span style={{ fontSize: '14px', fontWeight: 700, color: theme.textZinc }}>Seus Dados</span>
                       </div>
                       <input 
                         style={{ width: '100%', background: theme.isDark ? '#2A2A2E' : 'white', border: `1px solid ${theme.border}`, padding: '14px', borderRadius: '14px', fontSize: '16px', marginBottom: '12px', outline: 'none', color: theme.textZinc }}
                         placeholder="Seu Nome Completo"
                         value={address.customerName}
                         onChange={e => setAddress({...address, customerName: e.target.value})}
                       />
                       <input 
                         style={{ width: '100%', background: theme.isDark ? '#2A2A2E' : 'white', border: `1px solid ${theme.border}`, padding: '14px', borderRadius: '14px', fontSize: '16px', outline: 'none', color: theme.textZinc }}
                         placeholder="WhatsApp (Ex: 22 99999-9999)"
                         value={address.customerPhone}
                         onChange={e => setAddress({...address, customerPhone: e.target.value})}
                       />
                    </div>

                    <div style={{ background: theme.cardBg, padding: '20px', borderRadius: '24px', border: `1px solid ${theme.border}` }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                          <MapPin size={18} color={theme.primary} />
                          <span style={{ fontSize: '14px', fontWeight: 700, color: theme.textZinc }}>Endereço de Entrega</span>
                       </div>
                       <div style={{ position: 'relative' }}>
                         <input 
                           style={{ width: '100%', background: theme.isDark ? '#2A2A2E' : 'white', border: `1px solid ${theme.border}`, padding: '14px', borderRadius: '14px', fontSize: '16px', outline: 'none', color: theme.textZinc }}
                           placeholder="Nome da rua..."
                           value={address.street}
                           onChange={e => setAddress({...address, street: e.target.value})}
                         />
                         {addressSuggestions.length > 0 && (
                           <div style={{ position: 'absolute', bottom: '110%', left: 0, right: 0, background: theme.surface, borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 3500, overflow: 'hidden' }}>
                              {addressSuggestions.map((f, i) => (
                                <div key={i} onClick={() => handleSelectSuggestion(f)} style={{ padding: '14px 16px', fontSize: '13px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', color: theme.textZinc }}>
                                   <div style={{ fontWeight: 700 }}>{f.properties.street || f.properties.name}</div>
                                   <div style={{ fontSize: '11px', color: theme.textMuted }}>{f.properties.district || 'Cabo Frio'}</div>
                                </div>
                              ))}
                           </div>
                         )}
                       </div>
                       <div style={{ display: 'flex', gap: '10px', marginTop: '12px', width: '100%' }}>
                          <input style={{ flex: 1, minWidth: 0, width: '100%', background: theme.isDark ? '#2A2A2E' : 'white', border: `1px solid ${theme.border}`, padding: '12px', borderRadius: '12px', fontSize: '16px', color: theme.textZinc }} placeholder="Nº" value={address.number} onChange={e => setAddress({...address, number: e.target.value})} />
                          <input style={{ flex: 2, minWidth: 0, width: '100%', background: theme.isDark ? '#2A2A2E' : '#fcfcfd', border: `1px solid ${theme.border}`, padding: '12px', borderRadius: '12px', fontSize: '16px', color: theme.textZinc }} placeholder="Bairro" value={address.neighborhood} readOnly />
                       </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        if (!address.customerName.trim()) return alert("Por favor, informe seu nome.");
                        if (!address.customerPhone.trim()) return alert("Por favor, informe seu WhatsApp.");
                        if (!address.street.trim()) return alert("Por favor, informe a rua.");
                        if (!address.number.trim()) return alert("Por favor, informe o número da residência.");
                        if (!address.neighborhood.trim()) return alert("Por favor, o bairro é obrigatório.");
                        setCheckoutStep('payment');
                      }}
                      style={{ 
                        width: '100%', height: '62px', background: theme.primary, color: 'white', border: 'none', 
                        borderRadius: '20px', fontWeight: 900, fontSize: '15px', cursor: 'pointer',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                      }}
                    >
                      IR PARA PAGAMENTO
                    </button>
                    <button onClick={() => setCheckoutStep('cart')} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Voltar ao carrinho</button>
                 </div>
               )}

               {checkoutStep === 'payment' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: theme.cardBg, padding: '20px', borderRadius: '24px', border: `1px solid ${theme.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                           <ShoppingCart size={18} color={theme.primary} />
                           <span style={{ fontSize: '14px', fontWeight: 700, color: theme.textZinc }}>Selecione o Pagamento</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                           {['PIX', 'Cartão', 'Dinheiro'].map(method => (
                             <button
                               key={method}
                               onClick={() => setPaymentMethod(method)}
                               style={{
                                 flex: 1, padding: '16px 5px', borderRadius: '16px', fontSize: '13px', fontWeight: 900,
                                 border: `2px solid ${paymentMethod === method ? theme.primary : theme.border}`,
                                 background: paymentMethod === method ? (theme.isDark ? '#2A2A2E' : 'white') : 'transparent',
                                 color: paymentMethod === method ? theme.primary : theme.textMuted,
                                 transition: 'all 0.2s', cursor: 'pointer'
                               }}
                             >
                               {method}
                             </button>
                           ))}
                        </div>
                    </div>
                    
                    {paymentMethod === 'PIX' && (
                        <div style={{ padding: '24px', background: theme.isDark ? 'rgba(74,222,128,0.1)' : '#f0fdf4', borderRadius: '20px', border: `2px dashed ${theme.green}`, textAlign: 'center' }}>
                          <div style={{ color: theme.green, fontWeight: 800, fontSize: '12px', marginBottom: '8px', letterSpacing: '1px' }}>NOSSA CHAVE PIX</div>
                          <div style={{ fontSize: '17px', fontWeight: 900, color: theme.textZinc, marginBottom: '16px' }}>64.745.137/0001-58</div>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText("64745137000158");
                              alert("Chave PIX Copiada! 💸");
                            }}
                            style={{ width: '100%', padding: '14px', background: theme.surface, border: `1.5px solid ${theme.green}`, borderRadius: '14px', color: theme.green, fontWeight: 900, fontSize: '12px', cursor: 'pointer' }}
                          >
                            COPIAR CHAVE PIX
                          </button>
                        </div>
                    )}
                    
                    {paymentMethod === 'Dinheiro' && (
                        <div style={{ background: theme.cardBg, padding: '20px', borderRadius: '20px', border: `1px solid ${theme.border}` }}>
                          <label style={{ fontSize: '13px', fontWeight: 800, display: 'block', marginBottom: '10px', color: theme.textZinc }}>Troco para quanto?</label>
                          <input 
                            type="text" inputMode="decimal" placeholder="Ex: 50,00" value={changeNeeded}
                            onChange={(e) => setChangeNeeded(e.target.value)}
                            style={{ width: '100%', padding: '14px', borderRadius: '14px', border: `1px solid ${theme.border}`, fontSize: '16px', outline: 'none', background: theme.isDark ? '#2A2A2E' : 'white', color: theme.textZinc }}
                          />
                        </div>
                    )}

                    <div style={{ padding: '24px 4px', borderTop: `1px solid ${theme.border}`, marginTop: '10px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: theme.textMuted, fontWeight: 700, fontSize: '14px' }}>Produtos</span>
                          <span style={{ fontWeight: 800, fontSize: '14px', color: theme.textZinc }}>R$ {cartSubtotal.toFixed(2)}</span>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
                          <span style={{ color: theme.textMuted, fontWeight: 700, fontSize: '14px' }}>Entrega</span>
                          <span style={{ fontWeight: 800, fontSize: '14px', color: theme.green }}>{deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2)}`}</span>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '24px', fontWeight: 950, color: theme.textZinc }}>
                          <span>Total</span>
                          <span>R$ {cartTotal.toFixed(2)}</span>
                       </div>
                    </div>

                    <button 
                      onClick={handleCheckout}
                      style={{ 
                        width: '100%', height: '70px', background: theme.primary, color: 'white', border: 'none',
                        borderRadius: '24px', fontSize: '17px', fontWeight: 900, cursor: 'pointer',
                        boxShadow: '0 15px 35px rgba(0,0,0,0.2)'
                      }}
                    >
                      FINALIZAR E ENVIAR WHATSAPP
                    </button>
                    <button onClick={() => setCheckoutStep('address')} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '13px', fontWeight: 600, marginTop: '20px', cursor: 'pointer' }}>Voltar ao endereço</button>
                 </div>
               )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOrderSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: theme.surface, zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', textAlign: 'center' }}
          >
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 15 }}>
              <div style={{ width: '100px', height: '100px', background: theme.isDark ? 'rgba(74,222,128,0.1)' : '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px', color: theme.green }}>
                <CheckCircle2 size={60} />
              </div>
              <h1 style={{ color: theme.textZinc, fontSize: '2rem', fontWeight: '800', marginBottom: '15px' }}>Pedido Realizado!</h1>
              <p style={{ color: theme.textMuted, fontSize: '1.1rem', marginBottom: '30px', maxWidth: '300px' }}>Parabéns! Seu pedido foi enviado para nossa cozinha. Estamos abrindo o WhatsApp para você confirmar...</p>
              
              <button 
                onClick={() => window.location.href = `https://wa.me/5522996153138?text=${encodeURIComponent("*Paguei o pedido!*")}`}
                style={{ width: '100%', padding: '18px', borderRadius: '16px', background: '#25D366', color: 'white', border: 'none', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(37, 211, 102, 0.2)', cursor: 'pointer', fontWeight: 700 }}
              >
                Ir para o WhatsApp manualmente
              </button>
              
              <button 
                onClick={() => {
                  setIsOrderSuccess(false);
                  setCart([]);
                  setCheckoutStep('cart');
                }}
                style={{ marginTop: '20px', background: 'none', border: 'none', color: theme.textMuted, fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
              >
                Voltar ao Cardápio
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

export default App;
