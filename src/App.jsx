import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Clock, Star, ArrowRight, Home, 
  BadgeCheck, MapPin, Search, Heart, Share2,
  ChevronDown, CheckCircle2, ChevronLeft,
  ShoppingCart, Trash2, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { supabase } from './utils/supabase';
import { getMenuData } from './utils/menuStore';

// === CONFIGURAÇÃO DE TEMA (PALETA MELBURGUERS PREMIUM) ===
const theme = {
  primary: '#EC9424',        // Ouro Melburguers
  background: '#F8F8FA',    // Cinza Ultra-Claro (Padrão iFood/SaaS)
  surface: '#FFFFFF',       // Superfícies Brancas
  textZinc: '#18181B',      // Texto quase preto
  textMuted: '#71717A',     // Texto secundário
  green: '#22c55e',         // Cores de sucesso/preço
  red: '#f43f5e',           // Descontos/Ações de perigo
  accent: '#FDF2E9',        // Tom de ouro pastel para fundos de botões
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
    if (!address.street || !address.number || !address.neighborhood) {
      alert("Por favor, preencha o endereço completo!");
      return;
    }

    const orderId = Math.random().toString(36).substr(2, 5).toUpperCase();
    
    try {
      await supabase.from('pedidos').insert([{
        order_id: orderId, items: cart, subtotal: cartSubtotal,
        delivery_fee: deliveryFee, total: cartTotal, address: address,
        payment_method: paymentMethod, status: 'pendente'
      }]);

      confetti({
        particleCount: 200,
        spread: 80,
        origin: { y: 0.6 },
        colors: [theme.primary, theme.green, '#000']
      });

      setIsOrderSuccess(true);
      setIsCartOpen(false);
      
      const message = `*NOVO PEDIDO MELBURGUERS #${orderId}*\n\nItems: ${cart.map(i => `\u2022 ${i.name}`).join('\n')}\n\nTotal: R$ ${cartTotal.toFixed(2)}`;
      window.open(`https://wa.me/5522996153138?text=${encodeURIComponent(message)}`, '_blank');
      
    } catch (err) {
      alert("Erro ao enviar pedido para o restaurante.");
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
    <div style={{ background: theme.background, minHeight: '100vh', fontFamily: "'Inter', sans-serif", paddingBottom: '120px' }}>
      
      {/* 1. HERO / HEADER */}
      <div style={{ position: 'relative', height: '280px', background: '#000' }}>
        <img 
          src="/images/MEL Burgers iluminado e convidativo.png" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
          alt="Banner Principal"
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />
      </div>

      {/* 2. CARD DE INFORMAÇÕES DA LOJA */}
      <div style={{ maxWidth: '640px', margin: '-45px auto 0', position: 'relative', zIndex: 110, padding: '0 16px' }}>
        <div style={{ background: theme.surface, borderRadius: '28px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.03)' }}>
           <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ position: 'relative' }}>
                <img src="/images/logo.png" alt="Logo" style={{ width: '72px', height: '72px', borderRadius: '20px', objectFit: 'cover', border: `2px solid ${theme.primary}` }} />
              </div>
              <div style={{ flex: 1 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 900, color: theme.textZinc, letterSpacing: '-0.5px' }}>Melburguers</h1>
                    <BadgeCheck size={20} fill="#0095f6" color="white" />
                 </div>
                 <p style={{ color: theme.textMuted, fontSize: '13px', marginTop: '4px' }}>Hambúrgueres Artesanais • Gourmet • <span style={{ color: theme.textZinc, fontWeight: 600 }}>Cabo Frio</span></p>
              </div>
           </div>

           <div style={{ display: 'flex', justifyContent: 'space-around', padding: '18px 0', borderTop: '1px solid #f2f2f5' }}>
              <div style={{ textAlign: 'center' }}>
                 <div style={{ fontSize: '14px', fontWeight: 800, color: theme.textZinc }}>15-30 min</div>
                 <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '2px', fontWeight: 600 }}>TEMPO</div>
              </div>
              <div style={{ width: '1px', background: '#f2f2f5' }} />
              <div style={{ textAlign: 'center' }}>
                 <div style={{ fontSize: '14px', fontWeight: 800, color: theme.green }}>Grátis</div>
                 <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '2px', fontWeight: 600 }}>ENTREGA</div>
              </div>
              <div style={{ width: '1px', background: '#f2f2f5' }} />
              <div style={{ textAlign: 'center' }}>
                 <div style={{ fontSize: '14px', fontWeight: 800, color: theme.textZinc }}>R$ 15,00</div>
                 <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: '2px', fontWeight: 600 }}>MÍNIMO</div>
              </div>
           </div>
        </div>
      </div>

      {/* 3. CATEGORIAS */}
      <div style={{ 
        position: 'sticky', top: 0, zIndex: 120, 
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent', 
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        padding: '16px 0', marginTop: '24px', 
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
        transition: 'all 0.4s'
      }}>
        <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', padding: '15px 20px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
           <style>
             {`
               .category-btn-honey {
                  position: relative;
                  overflow: hidden;
                  min-width: 120px;
                  height: 48px;
                  border-radius: 100px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  padding-top: 16px !important; /* Valor original do index.css */
               }
               .honey-drip {
                  position: absolute;
                  top: -8px; /* Valor original do index.css */
                  left: 0;
                  right: 0;
                  height: 38px; /* Valor original do index.css */
                  background-image: url('/images/honey-frame.png');
                  background-size: 100% 100%;
                  background-repeat: no-repeat;
                  z-index: 10;
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
                 whiteSpace: 'nowrap',
                 background: activeCategory === cat ? theme.primary : 'white', 
                 color: activeCategory === cat ? 'white' : theme.textZinc,
                 border: `1.5px solid ${activeCategory === cat ? theme.primary : '#e2e2e7'}`,
                 boxShadow: activeCategory === cat ? `0 10px 25px ${theme.primary}44` : 'none',
                 paddingLeft: '20px',
                 paddingRight: '20px',
                 fontSize: '14px',
                 fontWeight: 850
               }}
             >
               <div className="honey-drip"></div>
               <span style={{ position: 'relative', zIndex: 20 }}>{cat}</span>
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
                       background: theme.surface, borderRadius: '24px', padding: '18px', 
                       display: 'flex', gap: '20px', alignItems: 'center',
                       border: '1px solid rgba(0,0,0,0.02)', boxShadow: '0 6px 20px rgba(0,0,0,0.02)'
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
               whileHover={{ backgroundColor: '#16161D' }}
               whileTap={{ scale: 0.97 }}
               onClick={() => setIsCartOpen(true)}
               style={{ 
                 background: '#0B0B0F', 
                 color: 'rgba(255,255,255,0.95)', 
                 border: '1px solid rgba(255,255,255,0.08)', 
                 height: '64px', 
                 width: '100%', 
                 maxWidth: '480px', 
                 borderRadius: '100px',
                 display: 'flex', 
                 alignItems: 'center', 
                 padding: '0 28px', 
                 boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                 cursor: 'pointer',
                 backdropFilter: 'blur(10px)',
                 position: 'relative',
                 overflow: 'hidden'
               }}
             >
                {/* Efeito de brilho sutil no topo */}
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
              style={{ width: '100%', maxWidth: '540px', background: 'white', borderRadius: '35px 35px 0 0', padding: '35px 24px', maxHeight: '92vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}
            >
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 900, color: theme.textZinc }}>Seu Carrinho</h2>
                  <button onClick={() => setIsCartOpen(false)} style={{ background: '#f5f5f7', border: 'none', padding: '10px', borderRadius: '50%' }}><ChevronDown size={24}/></button>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '35px' }}>
                  {cart.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfd', padding: '14px', borderRadius: '16px' }}>
                       <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                          <span style={{ fontWeight: 900, color: theme.primary }}>1x</span>
                          <span style={{ fontSize: '15px', fontWeight: 700 }}>{item.name}</span>
                       </div>
                       <button onClick={() => removeFromCart(i)} style={{ background: 'none', border: 'none', color: theme.red }}><Trash2 size={18}/></button>
                    </div>
                  ))}
               </div>

               <div style={{ background: '#f8f8fa', padding: '16px', borderRadius: '16px', border: '1px solid #e2e2e7', position: 'relative', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                     <MapPin size={16} color={theme.primary} />
                     <span style={{ fontSize: '13px', fontWeight: 700 }}>Endereço de Entrega</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input 
                      style={{ width: '100%', background: 'white', border: '1px solid #e2e2e7', padding: '14px', borderRadius: '12px', fontSize: '14px', outline: 'none' }}
                      placeholder="Comece a digitar sua rua..."
                      value={address.street}
                      onChange={e => setAddress({...address, street: e.target.value})}
                    />
                    {addressSuggestions.length > 0 && (
                      <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 3000, overflow: 'hidden' }}>
                         {addressSuggestions.map((f, i) => (
                           <div key={i} onClick={() => handleSelectSuggestion(f)} style={{ padding: '14px 16px', fontSize: '13px', borderBottom: '1px solid #f4f4f5', cursor: 'pointer' }}>
                              <div style={{ fontWeight: 700 }}>{f.properties.street || f.properties.name}</div>
                              <div style={{ fontSize: '11px', color: theme.textMuted }}>{f.properties.district || 'Cabo Frio'}</div>
                           </div>
                         ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                     <input style={{ flex: 1, border: '1px solid #eaeaef', padding: '12px', borderRadius: '10px', fontSize: '13px' }} placeholder="Nº" value={address.number} onChange={e => setAddress({...address, number: e.target.value})} />
                     <input style={{ flex: 2, border: '1px solid #eaeaef', padding: '12px', borderRadius: '10px', fontSize: '13px', background: '#fcfcfd' }} placeholder="Bairro" value={address.neighborhood} readOnly />
                  </div>
               </div>

               <div style={{ padding: '20px 4px', borderTop: '2px solid #f4f4f5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '22px', fontWeight: 950, color: theme.textZinc }}>
                     <span>Total</span>
                     <span>R$ {cartTotal.toFixed(2)}</span>
                  </div>
               </div>

               <button 
                 onClick={handleCheckout}
                 style={{ width: '100%', height: '66px', background: theme.primary, color: 'white', border: 'none', borderRadius: '22px', marginTop: '30px', fontSize: '17px', fontWeight: 900 }}
               >
                 FINALIZAR PEDIDO
               </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. TELA DE SUCESSO */}
      <AnimatePresence>
        {isOrderSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}
          >
             <CheckCircle2 size={70} color={theme.green} style={{ marginBottom: '32px' }} />
             <h1 style={{ fontSize: '28px', fontWeight: 950, color: theme.textZinc, marginBottom: '16px' }}>Pedido em Preparo!</h1>
             <button onClick={() => { setIsOrderSuccess(false); setCart([]); }} style={{ background: theme.textZinc, color: 'white', border: 'none', padding: '18px 45px', borderRadius: '20px', fontWeight: 800 }}>VOLTAR AO INÍCIO</button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default App;
