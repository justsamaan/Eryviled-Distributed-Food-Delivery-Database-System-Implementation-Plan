import React, { useState, useEffect } from 'react';
import { Store, ShoppingBag, Plus, Minus, CheckCircle, Tag, ArrowRight, ShieldCheck } from 'lucide-react';

export default function CustomerView() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState({});
  const [couponCode, setCouponCode] = useState('WELCOME20');
  const [orderResult, setOrderResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataSourceInfo, setDataSourceInfo] = useState(null);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await fetch('/api/restaurants');
      const data = await res.json();
      setRestaurants(data.data || []);
      setDataSourceInfo({ source: data.source, latencyMs: data.latencyMs });
      if (data.data && data.data.length > 0) {
        selectRestaurant(data.data[0]);
      }
    } catch (err) {
      console.error('Failed to load restaurants:', err);
    }
  };

  const selectRestaurant = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    setCart({});
    setOrderResult(null);
    try {
      const res = await fetch(`/api/restaurants/${restaurant.restaurant_id}/menu`);
      const data = await res.json();
      setMenuItems(data.data || []);
    } catch (err) {
      console.error('Failed to load menu:', err);
    }
  };

  const updateCart = (itemId, change) => {
    setCart(prev => {
      const currentQty = prev[itemId] || 0;
      const newQty = Math.max(0, currentQty + change);
      if (newQty === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: newQty };
    });
  };

  const calculateSubtotal = () => {
    let sum = 0;
    for (const [itemId, qty] of Object.entries(cart)) {
      const item = menuItems.find(m => m.item_id === Number(itemId));
      if (item) sum += item.price * qty;
    }
    return sum;
  };

  const handlePlaceOrder = async () => {
    const items = Object.entries(cart).map(([itemId, quantity]) => ({
      itemId: Number(itemId),
      quantity
    }));

    if (items.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: 1,
          restaurantId: selectedRestaurant.restaurant_id,
          deliveryAddressId: 1,
          items,
          couponCode
        })
      });
      const data = await res.json();
      setOrderResult(data);
      if (data.success) {
        setCart({});
      }
    } catch (err) {
      console.error('Failed to place order:', err);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = calculateSubtotal();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem' }}>Customer Food Delivery Storefront</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Browse menus and place food orders to observe the underlying ACID transaction pipeline execution in real-time.
            </p>
          </div>

          {dataSourceInfo && (
            <span className={`badge ${dataSourceInfo.source === 'REDIS_CACHE' ? 'badge-amber' : 'badge-blue'}`}>
              Fetched via {dataSourceInfo.source} ({dataSourceInfo.latencyMs} ms)
            </span>
          )}
        </div>
      </div>

      {/* Restaurant Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto' }}>
        {restaurants.map((r) => (
          <button
            key={r.restaurant_id}
            onClick={() => selectRestaurant(r)}
            className="glass-card"
            style={{
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              borderColor: selectedRestaurant?.restaurant_id === r.restaurant_id ? '#3b82f6' : 'var(--border-color)',
              background: selectedRestaurant?.restaurant_id === r.restaurant_id ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-card)',
              textAlign: 'left',
              minWidth: '220px'
            }}
          >
            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: selectedRestaurant?.restaurant_id === r.restaurant_id ? '#60a5fa' : 'var(--text-primary)' }}>
              {r.name}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {r.category_name} • ⭐ {r.rating} ({r.city})
            </p>
          </button>
        ))}
      </div>

      {/* Main Content Layout: Menu vs Shopping Cart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Menu Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            Menu Catalog - {selectedRestaurant?.name}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {menuItems.map((item) => {
              const qty = cart[item.item_id] || 0;
              return (
                <div key={item.item_id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.95rem' }}>{item.item_name}</h4>
                      <span className={`badge ${item.dish_type === 'VEG' || item.dish_type === 'VEGAN' ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: '0.65rem' }}>
                        {item.dish_type}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {item.description}
                    </p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.35rem' }}>
                      ${item.price.toFixed(2)}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.75rem' }}>
                        Stock: {item.available_stock} available
                      </span>
                    </p>
                  </div>

                  {/* Quantity Counter Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {qty > 0 && (
                      <>
                        <button onClick={() => updateCart(item.item_id, -1)} style={{ padding: '0.35rem', background: '#1e293b', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>
                          <Minus size={14} />
                        </button>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                      </>
                    )}
                    <button onClick={() => updateCart(item.item_id, 1)} className="btn btn-primary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}>
                      <Plus size={14} />
                      <span>{qty === 0 ? 'Add' : ''}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shopping Cart & Checkout Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={18} color="#3b82f6" />
              <span>Shopping Cart & Checkout</span>
            </h3>

            {Object.keys(cart).length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                Your cart is empty. Add menu items from the left catalog.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Cart Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {Object.entries(cart).map(([itemId, qty]) => {
                    const item = menuItems.find(m => m.item_id === Number(itemId));
                    if (!item) return null;
                    return (
                      <div key={itemId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.4rem 0', borderBottom: '1px solid #1e293b60' }}>
                        <span>{item.item_name} (x{qty})</span>
                        <span style={{ fontWeight: 600 }}>${(item.price * qty).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Promo Coupon Code */}
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PROMO COUPON CODE</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      style={{ flex: 1, padding: '0.4rem 0.75rem', background: '#030712', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
                    />
                    <span className="badge badge-emerald" style={{ alignSelf: 'center' }}>-$5.00</span>
                  </div>
                </div>

                {/* Subtotal Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Tax (NY 8.875%)</span>
                    <span>${(subtotal * 0.08875).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Delivery Fee</span>
                    <span>$2.99</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>
                    <span>Total Amount</span>
                    <span>${(Math.max(0, subtotal + subtotal * 0.08875 + 2.99 - 5.00)).toFixed(2)}</span>
                  </div>
                </div>

                <button onClick={handlePlaceOrder} className="btn btn-emerald" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
                  <ShieldCheck size={18} />
                  <span>{loading ? 'Executing Transaction...' : 'Place Order (ACID Commit)'}</span>
                </button>

              </div>
            )}
          </div>

          {/* ACID Transaction Execution Log Panel */}
          {orderResult && (
            <div className="glass-panel" style={{ padding: '1.25rem', borderColor: orderResult.success ? '#10b981' : '#f43f5e' }}>
              <h4 style={{ fontSize: '0.95rem', color: orderResult.success ? '#34d399' : '#f87171', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} />
                <span>Order #{orderResult.orderId} ACID Execution Log</span>
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {orderResult.logs && orderResult.logs.map((log, idx) => (
                  <div key={idx} style={{ fontSize: '0.75rem', fontFamily: 'Fira Code, monospace', padding: '0.35rem 0.6rem', background: '#030712', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    <span style={{ color: '#38bdf8' }}>[{log.step}]</span> {log.detail}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
