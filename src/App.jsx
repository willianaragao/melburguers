import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Clock, Star, ArrowRight, Home, 
  BadgeCheck, MapPin, Search, Heart, Share2,
  ChevronDown, CheckCircle2, ChevronLeft,
  ShoppingCart, Trash2, Info, UserPlus
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
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [changeNeeded, setChangeNeeded] = useState('');

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
      alert(`ERRO NO BANCO DE DADOS: ${errorMsg}\\n\\nPor favor, tire um print desta tela e me envie!`);
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
    <div style={{ background: theme.background, minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '500px', background: theme.surface, minHeight: '100vh', position: 'relative', boxShadow: '0 0 80px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, fontFamily: "'Inter', sans-serif", paddingBottom: '120px' }}>
      
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
                  padding-top: 6px !important; 
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

               {/* ETAPA 1: CARRINHO */}
               {checkoutStep === 'cart' && (
                 <>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '35px' }}>
                      {cart.map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'center', background: '#fcfcfd', padding: '12px', borderRadius: '18px', border: '1px solid #f0f0f5' }}>
                           <img src={item.image} alt={item.name} style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover' }} />
                           <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '15px', fontWeight: 700, color: theme.textZinc }}>{item.name}</div>
                              <div style={{ fontSize: '13px', fontWeight: 800, color: theme.green, marginTop: '2px' }}>R$ {item.price.toFixed(2)}</div>
                           </div>
                           <button onClick={() => removeFromCart(i)} style={{ background: '#fff0f0', border: 'none', padding: '8px', borderRadius: '10px', color: theme.red }}><Trash2 size={18}/></button>
                        </div>
                      ))}
                   </div>
                   <button 
                     onClick={() => setCheckoutStep('address')}
                      style={{ width: '100%', height: '62px', background: theme.textZinc, color: 'white', border: 'none', borderRadius: '20px', fontWeight: 900, fontSize: '15px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                   >
                     CONTINUAR PARA ENTREGA
                   </button>
                 </>
               )}

               {/* ETAPA 2: ENDEREÇO E IDENTIFICAÇÃO */}
               {checkoutStep === 'address' && (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: '#f8f8fa', padding: '20px', borderRadius: '24px', border: '1px solid #e2e2e7' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                          <UserPlus size={18} color={theme.primary} />
                          <span style={{ fontSize: '14px', fontWeight: 700 }}>Seus Dados</span>
                       </div>
                       <input 
                         style={{ width: '100%', border: '1px solid #e2e2e7', padding: '14px', borderRadius: '14px', fontSize: '14px', marginBottom: '12px', outline: 'none' }}
                         placeholder="Seu Nome Completo"
                         value={address.customerName}
                         onChange={e => setAddress({...address, customerName: e.target.value})}
                       />
                       <input 
                         style={{ width: '100%', border: '1px solid #e2e2e7', padding: '14px', borderRadius: '14px', fontSize: '14px', outline: 'none' }}
                         placeholder="WhatsApp (Ex: 22 99999-9999)"
                         value={address.customerPhone}
                         onChange={e => setAddress({...address, customerPhone: e.target.value})}
                       />
                    </div>

                    <div style={{ background: '#f8f8fa', padding: '20px', borderRadius: '24px', border: '1px solid #e2e2e7' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                          <MapPin size={18} color={theme.primary} />
                          <span style={{ fontSize: '14px', fontWeight: 700 }}>Endereço de Entrega</span>
                       </div>
                       <div style={{ position: 'relative' }}>
                         <input 
                           style={{ width: '100%', background: 'white', border: '1px solid #e2e2e7', padding: '14px', borderRadius: '14px', fontSize: '14px', outline: 'none' }}
                           placeholder="Nome da rua..."
                           value={address.street}
                           onChange={e => setAddress({...address, street: e.target.value})}
                         />
                         {addressSuggestions.length > 0 && (
                           <div style={{ position: 'absolute', bottom: '110%', left: 0, right: 0, background: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 3500, overflow: 'hidden' }}>
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
                          <input style={{ flex: 1, border: '1px solid #eaeaef', padding: '12px', borderRadius: '12px', fontSize: '14px' }} placeholder="Nº" value={address.number} onChange={e => setAddress({...address, number: e.target.value})} />
                          <input style={{ flex: 2, border: '1px solid #eaeaef', padding: '12px', borderRadius: '12px', fontSize: '14px', background: '#fcfcfd' }} placeholder="Bairro" value={address.neighborhood} readOnly />
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
                        width: '100%', height: '62px', background: theme.textZinc, color: 'white', border: 'none', 
                        borderRadius: '20px', fontWeight: 900, fontSize: '15px', cursor: 'pointer',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                      }}
                    >
                      IR PARA PAGAMENTO
                    </button>
                    <button onClick={() => setCheckoutStep('cart')} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '13px', fontWeight: 600 }}>Voltar ao carrinho</button>
                 </div>
               )}

               {/* ETAPA 3: PAGAMENTO */}
               {checkoutStep === 'payment' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    <div style={{ background: '#f8f8fa', padding: '20px', borderRadius: '24px', border: '1px solid #e2e2e7' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                           <ShoppingCart size={18} color={theme.primary} />
                           <span style={{ fontSize: '14px', fontWeight: 700 }}>Selecione o Pagamento</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                           {['PIX', 'Cartão', 'Dinheiro'].map(method => (
                             <button
                               key={method}
                               onClick={() => setPaymentMethod(method)}
                               style={{
                                 flex: 1, padding: '16px 5px', borderRadius: '16px', fontSize: '13px', fontWeight: 900,
                                 border: `2px solid ${paymentMethod === method ? theme.primary : '#e2e2e7'}`,
                                 background: paymentMethod === method ? 'white' : 'transparent',
                                 color: paymentMethod === method ? theme.primary : theme.textMuted,
                                 transition: 'all 0.2s', cursor: 'pointer'
                               }}
                             >
                               {method}
                             </button>
                           ))}
                        </div>
                    </div>
                    <AnimatePresence mode="wait">
                      {paymentMethod === 'PIX' && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          style={{ 
                            padding: '24px', 
                            background: '#f0fdf4', 
                            borderRadius: '20px', 
                            border: '2px dashed #22c55e', 
                            textAlign: 'center'
                          }}
                        >
                          <div style={{ color: '#166534', fontWeight: 800, fontSize: '12px', marginBottom: '8px', letterSpacing: '1px' }}>NOSSA CHAVE PIX</div>
                          <div style={{ fontSize: '17px', fontWeight: 900, color: '#14532d', marginBottom: '16px' }}>64.745.137/0001-58</div>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText("64745137000158");
                              alert("Chave PIX Copiada! 💸");
                            }}
                            style={{ 
                              width: '100%', padding: '14px', background: 'white', border: '1.5px solid #22c55e', 
                              borderRadius: '14px', color: '#166534', fontWeight: 900, fontSize: '12px', cursor: 'pointer'
                            }}
                          >
                            COPIAR CHAVE PIX
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <AnimatePresence mode="wait">
                      {paymentMethod === 'Dinheiro' && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          style={{ background: '#f8f8fa', padding: '20px', borderRadius: '20px', border: '1px solid #e2e2e7' }}
                        >
                          <label style={{ fontSize: '13px', fontWeight: 800, display: 'block', marginBottom: '10px', color: theme.textZinc }}>Troco para quanto?</label>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            placeholder="Ex: 50,00" 
                            value={changeNeeded}
                            onChange={(e) => setChangeNeeded(e.target.value)}
                            style={{ 
                              width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #e2e2e7', 
                              fontSize: '14px', outline: 'none', background: 'white' 
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div style={{ padding: '24px 4px', borderTop: '1px solid #e2e2e7', marginTop: '10px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: theme.textMuted, fontWeight: 700, fontSize: '14px' }}>Produtos</span>
                          <span style={{ fontWeight: 800, fontSize: '14px' }}>R$ {cartSubtotal.toFixed(2)}</span>
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
                      onClick={() => {
                        if (!paymentMethod) return alert("Por favor, selecione uma forma de pagamento.");
                        handleCheckout();
                      }}
                      style={{ 
                        width: '100%', height: '70px', background: theme.textZinc, color: 'white', border: 'none',
                        borderRadius: '24px', fontSize: '17px', fontWeight: 900, cursor: 'pointer',
                        boxShadow: '0 15px 35px rgba(0,0,0,0.2)'
                      }}
                    >
                      FINALIZAR E ENVIAR WHATSAPP
                    </button>
                    <button onClick={() => setCheckoutStep('address')} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '13px', fontWeight: 600, marginTop: '20px' }}>Voltar ao endereço</button>
                 </div>
               )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. TELA DE SUCESSO (DEPLOY GITHUB) */}
      <AnimatePresence>
        {isOrderSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: '#ffffff',
              zIndex: 3000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '30px',
              textAlign: 'center'
            }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <div style={{ 
                width: '100px', 
                height: '100px', 
                background: '#f0fdf4', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 25px',
                color: '#22c55e'
              }}>
                <CheckCircle2 size={60} />
              </div>
              <h1 style={{ color: '#2D1B14', fontSize: '2rem', fontWeight: '800', marginBottom: '15px' }}>
                Pedido Realizado!
              </h1>
              <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '30px', maxWidth: '300px' }}>
                Parabéns! Seu pedido foi enviado para nossa cozinha. Estamos abrindo o WhatsApp para você confirmar...
              </p>
              
              <button 
                className="checkout-btn"
                onClick={() => {
                  const message = `*NOVO PEDIDO MELBURGUERS*...`; // Mensagem simplificada pro fallback
                  window.location.href = `https://wa.me/5522996153138?text=${encodeURIComponent(message)}`;
                }}
                style={{
                  width: '100%',
                  padding: '18px',
                  borderRadius: '16px',
                  background: '#25D366',
                  color: 'white',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 10px 20px rgba(37, 211, 102, 0.2)'
                }}
              >
                Ir para o WhatsApp manualmente
              </button>
              
              <button 
                onClick={() => {
                  setIsOrderSuccess(false);
                  setCart([]);
                  setCheckoutStep('cart');
                  setAddress({ ...address, street: '', number: '', neighborhood: '', complement: '' });
                }}
                style={{
                  marginTop: '20px',
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
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
