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
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [changeNeeded, setChangeNeeded] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

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
      const { error: insertError } = await supabase
        .from('pedidos')
        .insert([{
          order_id: orderId, items: cart, subtotal: cartSubtotal,
          delivery_fee: deliveryFee, total: cartTotal, address: address,
          payment_method: paymentMethod === 'Dinheiro' && changeNeeded ? `Dinheiro (Troco para R$ ${changeNeeded})` : paymentMethod, 
          status: 'pendente'
        }]);

      if (insertError) throw insertError;

      confetti({
        particleCount: 200, spread: 90, origin: { y: 0.6 },
        colors: ['#EC9424', '#2D1B14', '#22c55e']
      });

      setIsOrderSuccess(true);
      setIsCartOpen(false);
      
      const message = `*NOVO PEDIDO MELBURGUERS #${orderId}*\n\n*Cliente:* ${address.customerName}\n*Tel:* ${address.customerPhone}\n\n*Items:*\n${cart.map(i => `\u2022 ${i.name}`).join('\n')}\n\n*Total:* R$ ${cartTotal.toFixed(2).replace('.', ',')}\n*Pagamento:* ${paymentMethod}${paymentMethod === 'Dinheiro' && changeNeeded ? ` (Troco para R$ ${changeNeeded})` : ''}\n\n*Endereço:* ${address.street}, ${address.number} - ${address.neighborhood}`;
      
      setTimeout(() => {
        window.location.href = `https://wa.me/5522996153138?text=${encodeURIComponent(message)}`;
      }, 3500);
      
    } catch (err) {
      alert(`ERRO AO ENVIAR PEDIDO: ${err.message}`);
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
              <h2>melburgerrs</h2>
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
            className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => scrollToCategory(cat)}
          >
            <div className="honey-drip"></div>
            <span style={{ position: 'relative', zIndex: 11 }}>{cat}</span>
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
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><MapPin size={18} color="#EC9424" /><span style={{ fontSize: '14px', fontWeight: 700 }}>Endereço</span></div>
                     <div style={{ position: 'relative' }}>
                       <input style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)', padding: '14px', borderRadius: '14px' }} placeholder="Nome da rua..." value={address.street} onChange={e => setAddress({...address, street: e.target.value})} />
                       {addressSuggestions.length > 0 && <div style={{ position: 'absolute', bottom: '110%', left: 0, right: 0, background: 'var(--card-bg)', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 3500, overflow: 'hidden' }}>
                          {addressSuggestions.map((f, i) => <div key={i} onClick={() => handleSelectSuggestion(f)} style={{ padding: '14px', fontSize: '13px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>{f.properties.street || f.properties.name}</div>)}
                       </div>}
                     </div>
                     <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                        <input style={{ flex: 1, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)', padding: '12px', borderRadius: '12px' }} placeholder="Nº" value={address.number} onChange={e => setAddress({...address, number: e.target.value})} />
                        <input style={{ flex: 2, border: '1px solid var(--border)', background: isDarkMode ? '#121215' : '#fcfcfd', color: 'var(--text)', padding: '12px', borderRadius: '12px' }} placeholder="Bairro" value={address.neighborhood} readOnly />
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
