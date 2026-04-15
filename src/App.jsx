import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Plus, Clock, Star, ArrowRight, Home, 
  BadgeCheck, MoreHorizontal, UserPlus, MapPin, 
  Truck, Link as LinkIcon, ChevronDown, Printer, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { supabase } from './utils/supabase';
import { getMenuData } from './utils/menuStore';
import { printOrder, formatOrderForPrinter } from './utils/printer';

const App = () => {
  const [appMenuData, setAppMenuData] = useState(getMenuData());
  const [activeCategory, setActiveCategory] = useState('Lanches');
  const [cart, setCart] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart', 'address' ou 'payment'
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [changeNeeded, setChangeNeeded] = useState('');
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [address, setAddress] = useState({
    street: '',
    number: '',
    neighborhood: '',
    complement: '',
    zipCode: '',
  });
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isMenuLoading, setIsMenuLoading] = useState(true);

  // Carregar Menu do Supabase
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const { data, error } = await supabase
          .from('menu_config')
          .select('data')
          .eq('id', 1)
          .single();
        
        if (data) {
          setAppMenuData(data.data);
        }
      } catch (err) {
        console.error("Erro ao carregar menu do Supabase:", err);
      } finally {
        setIsMenuLoading(false);
      }
    };
    fetchMenu();
  }, []);

  // Coordenadas aproximadas da Rua das Oliveiras, Unamar, Cabo Frio
  const SHOP_COORDS = { lat: -22.6225, lng: -42.0163 };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distância em km
  };

  const categories = Object.keys(appMenuData.menu);

  const addToCart = (item) => {
    setCart([...cart, item]);
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.price, 0);
  const cartTotal = cartSubtotal + deliveryFee;

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      const query = address.street.trim();
      if (query.length > 1 && !isSearchingAddress) {
        try {
          let cleanQuery = query.toLowerCase().replace(/^(rua|r\.|avenida|av\.|alameda|travessa|estrada)\s+/i, '');
          cleanQuery = cleanQuery.replace(/\d+.*$/, '').trim();
          
          // Adicionamos "Cabo Frio" na busca interna para forçar resultados na região e evitar cidades em MG
          const searchQuery = cleanQuery + " Cabo Frio";
          const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=10&lat=${SHOP_COORDS.lat}&lon=${SHOP_COORDS.lng}`);
          const data = await response.json();
          
          if (data && data.features) {
            // Filtrar para garantir que estamos pegando ruas ou locais com endereço, e no Brasil
            const brFeatures = data.features.filter(f => 
              f.properties.countrycode === 'BR' && 
              (f.properties.street || f.properties.district || f.properties.suburb || f.properties.locality)
            );
            setAddressSuggestions(brFeatures);
          }
        } catch (err) {
          console.error("Erro na busca de endereço:", err);
        }
      } else {
        setAddressSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [address.street]);

  const formatSuggestion = (feature) => {
    const p = feature.properties;
    const road = p.street || p.name || "";
    // No Brasil, bairro pode vir em district, suburb ou locality
    const neighborhood = p.district || p.suburb || p.locality || "";
    const city = p.city || "";
    
    let label = road;
    if (neighborhood && neighborhood.toLowerCase() !== road.toLowerCase()) {
      label += `, ${neighborhood}`;
    }
    if (city && city.toLowerCase() !== "cabo frio") {
      label += ` - ${city}`;
    }
    
    return label || "Endereço encontrado";
  };

  const handleSelectSuggestion = (feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    const p = feature.properties;
    
    const distance = calculateDistance(SHOP_COORDS.lat, SHOP_COORDS.lng, lat, lon);
    
    let fee = 5;
    if (distance > 2) {
      fee += (distance - 2) * 1.20;
    }
    
    setDeliveryFee(fee);
    setIsSearchingAddress(true);
    
    const numberMatch = address.street.match(/\d+/);
    const extractedNumber = numberMatch ? numberMatch[0] : '';

    setAddress({
      ...address,
      street: p.street || p.name || address.street,
      number: extractedNumber || address.number,
      neighborhood: p.district || p.suburb || p.locality || '',
      zipCode: p.postcode || '',
    });
    
    setAddressSuggestions([]);
    setTimeout(() => setIsSearchingAddress(false), 1000);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não suportada pelo seu navegador.");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      // Cálculo da distância e frete (Nova regra: 5,00 base até 2km + 1,20/km adicional)
      const distance = calculateDistance(SHOP_COORDS.lat, SHOP_COORDS.lng, latitude, longitude);
      let fee = 5;
      if (distance > 2) {
        fee += (distance - 2) * 1.20;
      }
      
      setDeliveryFee(fee);

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        const addr = data.address;
        
        setAddress(prev => ({
          ...prev,
          street: addr.road || addr.street || addr.suburb || '',
          neighborhood: addr.suburb || addr.neighbourhood || addr.city_district || '',
        }));
      } catch (err) {
        alert("Não conseguimos converter sua localização em texto. Por favor, preencha manualmente!");
      }
    }, (error) => {
      switch(error.code) {
        case error.PERMISSION_DENIED:
          alert("Permissão negada! Verifique se a localização está ativa no Android/iOS e permitida no cadeado do navegador.");
          break;
        case error.POSITION_UNAVAILABLE:
          alert("Sinal de GPS indisponível no momento.");
          break;
        case error.TIMEOUT:
          alert("A busca demorou muito. Tente novamente em um local mais aberto.");
          break;
        default:
          alert("Ocorreu um erro desconhecido na localização.");
      }
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (!address.street || !address.number || !address.neighborhood) {
      alert("Por favor, preencha o endereço completo!");
      return;
    }

    // 1. WhatsApp Message Template Customizado — Mel Burgers \uD83C\uDF6F
    const phoneNumber = "5522996153138"; 
    
    let message = "\u2705 *PEDIDO CONFIRMADO \u2014 MEL BURGERS* \uD83C\uDF54\uD83C\uDF6F\n\n";
    
    message += "━━━━━━━━━━━━━━━━━\n\n";
    message += "\uD83E\uDDFE *RESUMO DO PEDIDO*\n";
    cart.forEach(item => {
      message += `\u2022 ${item.name} \u2014 R$ ${item.price.toFixed(2).replace('.', ',')}\n`;
    });
    
    message += "\n━━━━━━━━━━━━━━━━━\n\n";
    message += "\uD83D\uDCCD *DADOS DE ENTREGA*\n";
    message += `${address.street}, ${address.number}\n`;
    message += `Bairro: ${address.neighborhood}\n`;
    if (address.zipCode) message += `CEP: ${address.zipCode}\n`;
    if (address.complement) message += `Refer\u00EAncia: ${address.complement}\n`;
    
    message += "\n━━━━━━━━━━━━━━━━━\n\n";
    message += "\uD83D\uDCB3 *FORMA DE PAGAMENTO*\n";
    message += `${paymentMethod} confirmado ✔️\n`;
    if (paymentMethod === 'Dinheiro' && changeNeeded) {
      message += `Troco para: R$ ${parseFloat(changeNeeded).toFixed(2).replace('.', ',')}\n`;
    }
    
    message += "\n━━━━━━━━━━━━━━━━━\n\n";
    message += `\uD83D\uDCB0 *TOTAL: R$ ${cartTotal.toFixed(2).replace('.', ',')}*\n`;
    
    message += "\n━━━━━━━━━━━━━━━━━\n";
    message += "\uD83D\uDC68\u200D\uD83C\uDF73 *STATUS DO PEDIDO*\n";
    message += "Seu pedido j\u00E1 est\u00E1 em preparo \uD83D\uDD25\n\n";
    message += "\uD83D\uDEB4\u200D\u2642\uFE0F Em breve sair\u00E1 para entrega!\n";
    
    message += "\n━━━━━━━━━━━━━━━━━\n";
    message += "\uD83D\uDCF2 *ACOMPANHE PELO WHATSAPP*\n";
    message += "Nossa equipe pode entrar em contato para atualiza\u00E7\u00F5es\n\n";
    message += "\u2728 Obrigado por escolher a Mel Burgers!\n";
    message += "\uD83C\uDF54 Sabor que conquista na primeira mordida";
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // 2. Envio em segundo plano (Keepalive garante o envio mesmo trocando de página)
    const orderData = {
      id: Math.random().toString(36).substr(2, 5).toUpperCase(),
      items: cart,
      subtotal: cartSubtotal,
      deliveryFee: deliveryFee,
      total: cartTotal,
      address: address,
      paymentMethod: paymentMethod,
      timestamp: new Date().toISOString(),
      status: 'pendente'
    };

    // Salva no Supabase para o painel admin ver em tempo real
    const saveToSupabase = async () => {
      try {
        const { error } = await supabase
          .from('orders')
          .insert([{
            order_id: orderData.id,
            items: orderData.items,
            subtotal: orderData.subtotal,
            delivery_fee: orderData.deliveryFee,
            total: orderData.total,
            address: orderData.address,
            payment_method: orderData.paymentMethod,
            status: 'pendente'
          }]);
        
        if (error) throw error;
      } catch (e) {
        console.error("Erro ao salvar no Supabase:", e);
      }
    };

    saveToSupabase();

    fetch('https://SUA-URL-N8N.com/webhook/pedidos-mel-burgers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
      keepalive: true
    }).catch(err => console.error("Erro background fetch:", err));

    // 3. Efeito de Confete (Burst Principal)
    confetti({
      particleCount: 200,
      spread: 90,
      origin: { y: 0.6 },
      zIndex: 4000,
      colors: ['#EC9424', '#2D1B14', '#22c55e']
    });

    // Burst secundário para efeito mais intenso
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        zIndex: 4000,
        colors: ['#EC9424', '#22c55e']
      });
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        zIndex: 4000,
        colors: ['#EC9424', '#22c55e']
      });
    }, 250);

    // 4. Mostrar tela de sucesso
    setIsOrderSuccess(true);
    setIsCartOpen(false);

    // 5. Redirecionamento 
    // Abrimos o WhatsApp em uma nova aba após 4 segundos para o cliente ver o confete
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
    }, 4000);
  };

  return (
    <div className="app-container">
      {/* Banner Top */}
      <div className="banner-top">
        <img src="/images/MEL Burgers iluminado e convidativo.png" alt="Mel Burgers Banner" />
      </div>

      {/* Compact Instagram Header */}
      <header className="insta-header">
        <div className="profile-top">
          <div className="avatar-wrapper">
            <div className="avatar-inner">
              <img src="/images/logo.png" alt="Mel Burgers Logo" />
            </div>
          </div>
          
          <div className="profile-title-area">
            <div className="username-row" style={{ justifyContent: 'flex-end' }}>
              <MoreHorizontal size={20} style={{ color: '#8e8e8e' }} />
            </div>
          </div>
        </div>

        <div className="bio-area">
          <div className="bio-text">
            <strong>MELBURGERS</strong> <BadgeCheck size={18} fill="#0095f6" stroke="white" style={{ verticalAlign: 'middle', marginLeft: '4px' }} /> <br />
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
          <a 
            href="https://www.instagram.com/melburgerrs?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
            target="_blank" 
            rel="noopener noreferrer"
            className="action-btn btn-primary"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Seguir
          </a>
          <button 
            className="action-btn btn-secondary btn-icon" 
            style={{ position: 'relative' }}
            onClick={() => {
              setIsCartOpen(true);
              setCheckoutStep('cart');
            }}
          >
            <ShoppingBag size={20} />
            {cart.length > 0 && (
              <span className="cart-badge-mini">{cart.length}</span>
            )}
          </button>
        </div>
      </header>

      {/* Category Nav */}
      <nav className="category-nav">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-btn ${activeCategory === cat ? 'active' : ''} has-honey-frame`}
            onClick={() => setActiveCategory(cat)}
          >
            <div className="honey-frame-overlay"></div>
            {cat}
          </button>
        ))}
      </nav>

      {/* Menu List */}
      <main className="menu-section">
        <h2 className="section-title">{activeCategory}</h2>
        
        <div className="items-grid">
          <AnimatePresence mode="wait">
            {appMenuData.menu[activeCategory].map((item, index) => (
              <motion.div
                key={item.id}
                className="menu-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="card-img">
                  <img src={item.image} alt={item.name} loading="lazy" />
                </div>
                <div className="card-info">
                  <div className="card-header">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                  <div className="card-footer">
                    <div className="price-container">
                      {item.original_price && (
                        <span className="price-old">R$ {item.original_price.toFixed(2).replace('.', ',')}</span>
                      )}
                      <span className="price-tag">R$ {item.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <button className="add-btn" onClick={() => addToCart(item)}>
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Info */}
      <footer style={{ padding: '0 20px 120px', textAlign: 'center', opacity: 0.6, fontSize: '13px' }}>
        <p>Aberto das 19h às 1h</p>
        <p>Desenvolvido com ❤️ para Mel Burgers</p>
      </footer>

      {/* Floating Cart */}
      {cart.length > 0 && (
        <motion.div
          className="cart-floating"
          initial={{ y: 100, x: "-50%", opacity: 0 }}
          animate={{ y: 0, x: "-50%", opacity: 1 }}
          whileTap={{ scale: 0.95, x: "-50%" }}
          onClick={() => {
            setIsCartOpen(true);
            setCheckoutStep('cart');
          }}
        >
          <div className="cart-info">
            <span className="cart-count">{cart.length}</span>
            <div className="cart-view-text">Ver Carrinho</div>
          </div>
          <div className="cart-price">
            R$ {cartTotal.toFixed(2).replace('.', ',')}
          </div>
        </motion.div>
      )}

      {/* Cart Modal Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            className="cart-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 1001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <motion.div 
              className="cart-modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                width: '100%',
                maxWidth: '440px',
                maxHeight: '90vh',
                borderRadius: '32px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
                position: 'relative',
              }}
            >
              <div className="modal-header" style={{ padding: '16px 20px', position: 'relative', textAlign: 'center', borderBottom: '1px solid #f5f5f5' }}>
                <div className="modal-handle" style={{ width: '40px', height: '4px', background: '#ddd', borderRadius: '2px', margin: '0 auto 12px' }}></div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#2D1B14' }}>
                  {checkoutStep === 'cart' ? 'Seu Carrinho' : checkoutStep === 'address' ? 'Endereço de Entrega' : 'Forma de Pagamento'}
                </h3>
                <button 
                  className="close-modal" 
                  onClick={() => setIsCartOpen(false)} 
                  style={{ position: 'absolute', right: '15px', top: '15px', background: '#f5f5f5', border: 'none', width: '30px', height: '30px', borderRadius: '50%', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>

              <div className="cart-items-list" style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '0 20px',
                minHeight: '300px'
              }}>
                {checkoutStep === 'cart' ? (
                  cart.length === 0 ? (
                    <div className="empty-cart" style={{ textAlign: 'center', padding: '50px 0', opacity: 0.3 }}>
                      <ShoppingBag size={48} style={{ margin: '0 auto 10px' }} />
                      <p>Seu carrinho está vazio</p>
                    </div>
                  ) : (
                    cart.map((item, index) => (
                      <div key={index} className="cart-item" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 0', borderBottom: '1px solid #f5f5f5' }}>
                        <div className="cart-item-img" style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden' }}>
                          <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div className="cart-item-info" style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: '15px' }}>{item.name}</h4>
                          <span className="cart-item-price" style={{ color: '#EC9424', fontWeight: '700', fontSize: '14px' }}>R$ {item.price.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <button 
                          className="remove-item" 
                          onClick={() => removeFromCart(index)}
                          style={{ background: '#fff0f0', color: '#ff4444', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}
                        >
                          Remover
                        </button>
                      </div>
                    ))
                  )
                ) : checkoutStep === 'address' ? (
                  <div className="address-form" style={{ padding: '10px 0' }}>
                    <button 
                      onClick={handleGetLocation}
                      style={{ 
                        width: '100%', 
                        padding: '12px', 
                        marginBottom: '20px', 
                        borderRadius: '12px', 
                        border: '1px solid #EC9424',
                        background: '#FFF9F0',
                        color: '#EC9424',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <MapPin size={18} /> Usar minha localização atual
                    </button>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative' }}>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="text" 
                          placeholder="Rua / Logradouro" 
                          value={address.street}
                          onChange={(e) => setAddress({...address, street: e.target.value})}
                          className="address-input"
                          style={{ width: '100%' }}
                        />
                        {addressSuggestions.length > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: 'white',
                            border: '1px solid #eee',
                            borderRadius: '12px',
                            marginTop: '5px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            zIndex: 1002,
                            maxHeight: '200px',
                            overflowY: 'auto'
                          }}>
                            {addressSuggestions.map((suggestion, idx) => (
                              <div 
                                key={idx}
                                onClick={() => handleSelectSuggestion(suggestion)}
                                style={{
                                  padding: '12px 15px',
                                  borderBottom: idx === addressSuggestions.length - 1 ? 'none' : '1px solid #f5f5f5',
                                  fontSize: '14px',
                                  cursor: 'pointer',
                                  color: '#333',
                                  fontWeight: '500'
                                }}
                              >
                                {formatSuggestion(suggestion)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                          type="text" 
                          placeholder="Nº" 
                          value={address.number}
                          onChange={(e) => setAddress({...address, number: e.target.value})}
                          style={{ width: '80px' }}
                          className="address-input"
                        />
                        <input 
                          type="text" 
                          placeholder="Bairro" 
                          value={address.neighborhood}
                          onChange={(e) => setAddress({...address, neighborhood: e.target.value})}
                          style={{ flex: 1 }}
                          className="address-input"
                        />
                      </div>
                      <input 
                        type="text" 
                        placeholder="CEP (Preenchido automático)" 
                        value={address.zipCode}
                        onChange={(e) => setAddress({...address, zipCode: e.target.value})}
                        className="address-input"
                      />
                      <input 
                        type="text" 
                        placeholder="Ponto de Referência / Complemento" 
                        value={address.complement}
                        onChange={(e) => setAddress({...address, complement: e.target.value})}
                        className="address-input"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="payment-form" style={{ padding: '10px 0' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '10px' }}>
                      Escolha como deseja pagar:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                      {['PIX', 'Cartão', 'Dinheiro'].map((method) => (
                        <button
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          style={{
                            padding: '12px 5px',
                            borderRadius: '10px',
                            border: '1px solid',
                            borderColor: paymentMethod === method ? '#EC9424' : '#eee',
                            background: paymentMethod === method ? '#FFF9F0' : 'white',
                            color: paymentMethod === method ? '#EC9424' : '#888',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                    <AnimatePresence mode="wait">
                      {paymentMethod === 'PIX' && (
                        <motion.div 
                          key="pix"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          style={{ 
                            padding: '20px', 
                            background: '#f0fdf4', 
                            borderRadius: '16px', 
                            border: '2px dashed #22c55e', 
                            textAlign: 'center' 
                          }}
                        >
                          <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#166534' }}>
                            <strong>Nossa Chave PIX:</strong><br />
                            <span style={{ fontSize: '16px', color: '#14532d', fontWeight: '800' }}>CNPJ 64.745.137/0001-58</span>
                          </p>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText("64745137000158");
                              alert("Chave PIX Copiada!");
                            }}
                            style={{ 
                              width: '100%',
                              padding: '12px', 
                              background: '#22c55e', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '12px', 
                              cursor: 'pointer', 
                              fontSize: '14px', 
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px'
                            }}
                          >
                            Copiar Chave PIX
                          </button>
                          <p style={{ marginTop: '10px', fontSize: '11px', color: '#166534', opacity: 0.8 }}>
                            O comprovante deverá ser enviado no próximo passo.
                          </p>
                        </motion.div>
                      )}
                      {paymentMethod === 'Dinheiro' && (
                        <motion.div 
                          key="cash"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Troco para quanto?</label>
                          <input 
                            type="number" 
                            placeholder="Ex: 50,00" 
                            value={changeNeeded}
                            onChange={(e) => setChangeNeeded(e.target.value)}
                            className="address-input"
                          />
                          <p style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>Deixe em branco se não precisar de troco.</p>
                        </motion.div>
                      )}
                      {paymentMethod === 'Cartão' && (
                        <motion.div 
                          key="card"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          style={{ textAlign: 'center', padding: '10px', color: '#888', fontSize: '14px' }}
                        >
                          Levaremos a maquininha até você! 💳
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="modal-footer" style={{ padding: '20px', borderTop: '1px solid #f5f5f5', background: 'white' }}>
                  <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', opacity: 0.6 }}>Subtotal</span>
                    <span style={{ fontSize: '14px', opacity: 0.6 }}>R$ {cartSubtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '14px', color: '#EC9424' }}>Frete</span>
                    <span style={{ fontSize: '14px', color: '#EC9424' }}>+ R$ {deliveryFee.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <span style={{ fontWeight: 700, fontSize: '18px' }}>Total</span>
                    <span className="total-price" style={{ fontWeight: 800, fontSize: '22px', color: '#EC9424' }}>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  
                  {checkoutStep === 'cart' ? (
                    <button 
                      className="checkout-btn" 
                      onClick={() => setCheckoutStep('address')}
                      style={{ width: '100%', padding: '16px', borderRadius: '15px', background: '#EC9424', color: 'white', border: 'none', fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                      <Truck size={20} /> Ir para entrega
                    </button>
                  ) : checkoutStep === 'address' ? (
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <button 
                        className="action-btn btn-secondary" 
                        onClick={() => setCheckoutStep('cart')}
                        style={{ flex: '0 0 80px', height: '54px', borderRadius: '15px', border: '1px solid #eee', background: 'white', fontSize: '0.9rem' }}
                      >
                        Voltar
                      </button>
                      <button 
                        className="checkout-btn" 
                        onClick={() => {
                          if (!address.street || !address.number || !address.neighborhood) {
                            alert("Preencha o endereço completo!");
                            return;
                          }
                          setCheckoutStep('payment');
                        }}
                        style={{ flex: 1, height: '54px', borderRadius: '15px', background: '#EC9424', color: 'white', border: 'none', fontWeight: '800', fontSize: '0.95rem', padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
                      >
                        Prosseguir para o pagamento
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <button 
                        className="action-btn btn-secondary" 
                        onClick={() => setCheckoutStep('address')}
                        style={{ flex: '0 0 80px', height: '54px', borderRadius: '15px', border: '1px solid #eee', background: 'white', fontSize: '0.9rem' }}
                      >
                        Voltar
                      </button>
                      <button 
                        className="checkout-btn" 
                        onClick={handleCheckout}
                        disabled={isPrinting}
                        style={{ flex: 1, height: '54px', borderRadius: '15px', background: '#EC9424', color: 'white', border: 'none', fontWeight: '800', fontSize: '0.95rem', padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
                      >
                        {isPrinting ? 'Enviando...' : 'Finalizar via WhatsApp'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Overay */}
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
                  // Fallback btn caso o popup bloqueie
                  const phoneNumber = "5522996153138";
                  window.location.href = `https://wa.me/${phoneNumber}`;
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
  );
};

export default App;
