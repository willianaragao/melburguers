import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Plus, Clock, Star, ArrowRight, Home, 
  BadgeCheck, MoreHorizontal, UserPlus, MapPin, 
  Truck, Link as LinkIcon, ChevronDown, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { menuData } from './data/menu';
import { printOrder, formatOrderForPrinter } from './utils/printer';

const App = () => {
  const [activeCategory, setActiveCategory] = useState('Lanches');
  const [cart, setCart] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart' ou 'address'
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [address, setAddress] = useState({
    street: '',
    number: '',
    neighborhood: '',
    complement: '',
  });
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

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

  const categories = Object.keys(menuData.menu);

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
      if (address.street.length > 2 && !isSearchingAddress) {
        try {
          // viewbox para limitar buscas à região de Cabo Frio/Tamoios/Unamar
          const viewbox = "-42.25,-22.50,-41.90,-22.75"; 
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address.street)}&viewbox=${viewbox}&bounded=1&countrycodes=br&limit=6&addressdetails=1`);
          const data = await response.json();
          
          // Filtrar resultados que tenham ao menos uma rua ou bairro
          const filteredData = data.filter(item => item.address && (item.address.road || item.address.street || item.address.suburb || item.address.neighbourhood));
          setAddressSuggestions(filteredData);
        } catch (err) {
          console.error("Erro na busca de endereço:", err);
        }
      } else {
        setAddressSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [address.street]);

  const formatSuggestion = (item) => {
    const road = item.address.road || item.address.street || "";
    const neighborhood = item.address.suburb || item.address.neighbourhood || item.address.city_district || "";
    
    if (road && neighborhood) return `${road}, ${neighborhood}`;
    return road || neighborhood || item.display_name.split(',')[0];
  };

  const handleSelectSuggestion = (suggestion) => {
    const { lat, lon, address: addrDetails } = suggestion;
    const distance = calculateDistance(SHOP_COORDS.lat, SHOP_COORDS.lng, parseFloat(lat), parseFloat(lon));
    
    let fee = 5;
    if (distance > 2) {
      fee += (distance - 2) * 1.20;
    }
    
    setDeliveryFee(fee);
    setIsSearchingAddress(true); // Bloqueia trigger do useEffect temporariamente
    
    setAddress({
      ...address,
      street: addrDetails.road || addrDetails.street || suggestion.display_name.split(',')[0],
      neighborhood: addrDetails.suburb || addrDetails.neighbourhood || addrDetails.city_district || '',
    });
    
    setAddressSuggestions([]);
    
    // Libera busca após um pequeno delay
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

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!address.street || !address.number || !address.neighborhood) {
      alert("Por favor, preencha o endereço completo!");
      return;
    }

    // 1. WhatsApp Message Template Customizado
    const phoneNumber = "5522996153138"; 
    
    let message = "✅ *PEDIDO CONFIRMADO — MEL BURGERS* 🍔\n\n";
    
    message += "━━━━━━━━━━━━━━━━━━━\n";
    message += "🧾 *RESUMO DO PEDIDO*\n";
    cart.forEach(item => {
      message += `• ${item.name} — R$ ${item.price.toFixed(2).replace('.', ',')}\n`;
    });
    
    message += "\n━━━━━━━━━━━━━━━━━━━\n";
    message += "📍 *DADOS DE ENTREGA*\n";
    message += `${address.street}, ${address.number}\n`;
    message += `Bairro: ${address.neighborhood}\n`;
    if (address.complement) message += `Referência: ${address.complement}\n`;
    
    message += "\n━━━━━━━━━━━━━━━━━━━\n";
    message += "💳 *FORMA DE PAGAMENTO*\n";
    message += `${paymentMethod} confirmado ✔️\n`;
    
    message += "\n━━━━━━━━━━━━━━━━━━━\n";
    message += `💰 *TOTAL: R$ ${cartTotal.toFixed(2).replace('.', ',')}*\n`;
    
    message += "\n━━━━━━━━━━━━━━━━━━━\n";
    message += "👨‍🍳 *STATUS DO PEDIDO*\n";
    message += "Seu pedido já está em preparo 🔥\n\n";
    message += "🚴‍♂️ Em breve sairá para entrega!\n";
    
    message += "\n━━━━━━━━━━━━━━━━━━━\n";
    message += "📲 *ACOMPANHE PELO WHATSAPP*\n";
    message += "Nossa equipe pode entrar em contato para atualizações\n\n";
    message += "✨ Obrigado por escolher a Mel Burgers!\n";
    message += "🍔 Sabor que conquista na primeira mordida";

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // 2. Send to Dashboard (via n8n Webhook)
    setIsPrinting(true);
    
    try {
      const orderData = {
        id: Math.random().toString(36).substr(2, 5).toUpperCase(),
        items: cart,
        subtotal: cartSubtotal,
        deliveryFee: deliveryFee,
        total: cartTotal,
        address: address,
        paymentMethod: paymentMethod,
        timestamp: new Date().toISOString(),
      };

      await fetch('https://SUA-URL-N8N.com/webhook/pedidos-mel-burgers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
    } catch (err) {
      console.error("Falha ao enviar ao Dashboard:", err);
    } finally {
      setIsPrinting(false);
      window.open(whatsappUrl, '_blank');
    }
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
            {menuData.menu[activeCategory].map((item, index) => (
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
          >
            <motion.div 
              className="cart-modal-content"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '90vh',
                borderTopLeftRadius: '30px',
                borderTopRightRadius: '30px',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1001,
                boxShadow: '0 -10px 40px rgba(0,0,0,0.1)'
              }}
            >
              <div className="modal-header" style={{ padding: '20px', position: 'relative', textAlign: 'center' }}>
                <div className="modal-handle" style={{ width: '40px', height: '4px', background: '#ddd', borderRadius: '2px', margin: '0 auto 15px' }}></div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{checkoutStep === 'cart' ? 'Seu Carrinho' : 'Endereço de Entrega'}</h3>
                <button className="close-modal" onClick={() => setIsCartOpen(false)} style={{ position: 'absolute', right: '20px', top: '15px', background: '#f5f5f5', border: 'none', width: '30px', height: '30px', borderRadius: '50%', fontSize: '20px', lineHeight: 1, cursor: 'pointer' }}>×</button>
              </div>

              <div className="cart-items-list" style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
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
                ) : (
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
                        placeholder="Ponto de Referência / Complemento" 
                        value={address.complement}
                        onChange={(e) => setAddress({...address, complement: e.target.value})}
                        className="address-input"
                      />
                    </div>

                    <div style={{ marginTop: '20px' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '10px' }}>
                        Forma de Pagamento
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        {['PIX', 'Cartão', 'Dinheiro'].map((method) => (
                          <button
                            key={method}
                            onClick={() => setPaymentMethod(method)}
                            style={{
                              padding: '10px 5px',
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
                    </div>
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
                      style={{ width: '100%', padding: '16px', borderRadius: '15px', background: '#EC9424', color: 'white', border: 'none', fontWeight: '700', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                      <Truck size={20} /> Preencher endereço de entrega
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        className="action-btn btn-secondary" 
                        onClick={() => setCheckoutStep('cart')}
                        style={{ flex: '0 0 100px', height: '54px', borderRadius: '15px', border: '1px solid #eee', background: 'white' }}
                      >
                        Voltar
                      </button>
                      <button 
                        className="checkout-btn" 
                        onClick={handleCheckout}
                        disabled={isPrinting}
                        style={{ flex: 1, height: '54px', borderRadius: '15px', background: '#EC9424', color: 'white', border: 'none', fontWeight: '700', fontSize: '16px' }}
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
    </div>
  );
};

export default App;
