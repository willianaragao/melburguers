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
  const [address, setAddress] = useState({
    street: '',
    number: '',
    neighborhood: '',
    complement: '',
  });

  const categories = Object.keys(menuData.menu);

  const addToCart = (item) => {
    setCart([...cart, item]);
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.price, 0);

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não suportada pelo seu navegador.");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        const addr = data.address;
        
        setAddress(prev => ({
          ...prev,
          street: addr.road || addr.street || '',
          neighborhood: addr.suburb || addr.neighbourhood || addr.city_district || '',
        }));
      } catch (err) {
        alert("Não conseguimos obter o endereço exato, mas você pode preencher manualmente!");
      }
    }, () => {
      alert("Permissão de localização negada.");
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!address.street || !address.number || !address.neighborhood) {
      alert("Por favor, preencha o endereço completo!");
      return;
    }

    // 1. WhatsApp Message Logic
    const phoneNumber = "5522996153138"; 
    let message = `*NOVO PEDIDO - MEL BURGERS*\n\n`;
    
    message += `*ITENS:*\n`;
    cart.forEach(item => {
      message += `• ${item.name} - R$ ${item.price.toFixed(2).replace('.', ',')}\n`;
    });
    
    message += `\n*ENTREGA EM:*\n`;
    message += `${address.street}, ${address.number}\n`;
    message += `Bairro: ${address.neighborhood}\n`;
    if (address.complement) message += `Ref: ${address.complement}\n`;
    
    message += `\n*TOTAL: R$ ${cartTotal.toFixed(2).replace('.', ',')}*\n`;
    message += `\nDesenvolvido por Mel Burgers ✨`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // 2. Send to Dashboard (via n8n Webhook)
    setIsPrinting(true);
    
    try {
      const orderData = {
        id: Math.random().toString(36).substr(2, 5).toUpperCase(),
        items: cart,
        total: cartTotal,
        address: address,
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
            >
              <div className="modal-header">
                <div className="modal-handle"></div>
                <h3>{checkoutStep === 'cart' ? 'Seu Carrinho' : 'Endereço de Entrega'}</h3>
                <button className="close-modal" onClick={() => setIsCartOpen(false)}>×</button>
              </div>

              <div className="cart-items-list">
                {checkoutStep === 'cart' ? (
                  cart.length === 0 ? (
                    <div className="empty-cart">
                      <ShoppingBag size={48} opacity={0.2} />
                      <p>Seu carrinho está vazio</p>
                    </div>
                  ) : (
                    cart.map((item, index) => (
                      <div key={index} className="cart-item">
                        <div className="cart-item-img">
                          <img src={item.image} alt={item.name} />
                        </div>
                        <div className="cart-item-info">
                          <h4>{item.name}</h4>
                          <span className="cart-item-price">R$ {item.price.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <button className="remove-item" onClick={() => removeFromCart(index)}>Remover</button>
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
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <input 
                        type="text" 
                        placeholder="Rua / Logradouro" 
                        value={address.street}
                        onChange={(e) => setAddress({...address, street: e.target.value})}
                        className="address-input"
                      />
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
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="modal-footer">
                  <div className="total-row">
                    <span>Total</span>
                    <span className="total-price">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  
                  {checkoutStep === 'cart' ? (
                    <button 
                      className="checkout-btn" 
                      onClick={() => setCheckoutStep('address')}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                      <Truck size={20} /> Preencher endereço de entrega
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        className="action-btn btn-secondary" 
                        onClick={() => setCheckoutStep('cart')}
                        style={{ flex: '0 0 100px' }}
                      >
                        Voltar
                      </button>
                      <button 
                        className="checkout-btn" 
                        onClick={handleCheckout}
                        disabled={isPrinting}
                        style={{ flex: 1 }}
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

