'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  Banknote,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';

type Status = 'Received' | 'Washing' | 'Ironing' | 'Ready';
type Section = 'Orders' | 'Customers' | 'Reports' | 'Expenses';
type Role = 'Owner' | 'Counter staff';
type Order = {
  id: number;
  code: string;
  token: string;
  name: string;
  phone: string;
  email: string;
  items: string;
  service: string;
  total: number;
  paid: boolean;
  urgent: boolean;
  status: Status;
  createdAt: string;
  updatedAt: string;
};
type Expense = { id: number; title: string; category: string; amount: number; createdAt: string };
type NewOrder = {
  name: string;
  phone: string;
  email: string;
  items: string;
  service: string;
  total: string;
  paid: boolean;
  urgent: boolean;
};
type WhatsAppHandoff = {
  phone: string;
  text: string;
  link: string;
  url: string;
  sent: boolean;
  channel: 'twilio' | 'whatsapp';
  notice?: string;
};
const nextStatus: Record<Status, Status> = {
  Received: 'Washing',
  Washing: 'Ironing',
  Ironing: 'Ready',
  Ready: 'Ready',
};
const navItems: { label: Section; icon: LucideIcon }[] = [
  { label: 'Orders', icon: LayoutDashboard },
  { label: 'Customers', icon: Users },
  { label: 'Reports', icon: FileText },
  { label: 'Expenses', icon: Wallet },
];
const emptyOrder: NewOrder = {
  name: '',
  phone: '',
  email: '',
  items: '',
  service: 'Wash & Iron',
  total: '',
  paid: false,
  urgent: false,
};
const money = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
const isToday = (iso: string) => {
  const date = new Date(iso);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
};
const formatWhen = (iso: string) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));

function beginWhatsApp() {
  return window.open('about:blank', '_blank');
}

function finishWhatsApp(popup: Window | null, handoff: WhatsAppHandoff | null) {
  if (!popup) return;
  window.setTimeout(() => {
    try {
      if (!handoff || handoff.sent || !handoff.url) {
        popup.close();
        return;
      }
      popup.location.replace(handoff.url);
    } catch {
      popup.close();
    }
  }, 0);
}

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState<Section>('Orders');
  const [role, setRole] = useState<Role>('Owner');
  const [userName, setUserName] = useState('Nirmal Kumar');
  const [userEmail, setUserEmail] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [showNew, setShowNew] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState('');
  const [newOrder, setNewOrder] = useState<NewOrder>(emptyOrder);
  const [expenseDraft, setExpenseDraft] = useState({ title: '', category: 'Supplies', amount: '' });
  const [lastMessage, setLastMessage] = useState<WhatsAppHandoff | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await fetch('/api/auth/session');
        if (!session.ok) {
          window.location.assign('/login');
          return;
        }
        const { user } = await session.json();
        if (cancelled) return;
        setUserName(user.name);
        setUserEmail(user.email);
        setRole(user.role === 'owner' ? 'Owner' : 'Counter staff');
        const ordersResponse = await fetch('/api/orders');
        const ordersBody = await ordersResponse.json();
        if (!ordersResponse.ok) throw new Error(ordersBody.error || 'Could not load orders');
        if (cancelled) return;
        setOrders(ordersBody.orders);
        if (user.role === 'owner') {
          const expensesResponse = await fetch('/api/expenses');
          const expensesBody = await expensesResponse.json();
          if (expensesResponse.ok) setExpenses(expensesBody.expenses);
        }
        setReady(true);
      } catch {
        if (!cancelled) {
          setReady(true);
          setLoadError('Could not load the counter. Refresh the page.');
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredOrders = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch = `${order.code} ${order.name} ${order.phone} ${order.email} ${order.items}`.toLowerCase().includes(needle);
      return matchesSearch && (statusFilter === 'All statuses' || order.status === statusFilter);
    });
  }, [orders, query, statusFilter]);
  const todayOrders = useMemo(() => orders.filter((order) => isToday(order.createdAt)), [orders]);
  const pendingCount = orders.filter((order) => order.status !== 'Ready').length;
  const readyCount = orders.filter((order) => order.status === 'Ready').length;
  const sales = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const dueTotal = orders.filter((order) => !order.paid).reduce((sum, order) => sum + order.total, 0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setShowNew(true);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === 'Escape') {
        setShowNew(false);
        setShowMessage(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };

  const createOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const popup = beginWhatsApp();
    setSaving(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newOrder, total: Number(newOrder.total) }),
      });
      const result = await response.json();
      if (!response.ok) {
        popup?.close();
        notify(result.error ?? 'Could not create the order');
        return;
      }
      setOrders((current) => [result.order, ...current]);
      setLastMessage(result.whatsapp);
      setShowNew(false);
      setNewOrder(emptyOrder);
      setShowMessage(true);
      finishWhatsApp(popup, result.whatsapp);
      notify(result.whatsapp?.sent ? `${result.order.code} created · WhatsApp sent` : `${result.order.code} created · send the WhatsApp update`);
    } catch {
      popup?.close();
      notify('Could not reach the server. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const advanceOrder = async (order: Order) => {
    if (order.status === 'Ready' || saving) return;
    const popup = beginWhatsApp();
    setSaving(true);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus[order.status] }),
      });
      const result = await response.json();
      if (!response.ok) {
        popup?.close();
        notify(result.error ?? 'Could not update the order');
        return;
      }
      setOrders((current) => current.map((item) => item.id === order.id ? result.order : item));
      setLastMessage(result.whatsapp);
      setShowMessage(true);
      finishWhatsApp(popup, result.whatsapp);
      notify(`${result.order.code} moved to ${result.order.status}`);
    } catch {
      popup?.close();
      notify('Could not reach the server. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const sendUpdate = async (order: Order) => {
    const popup = beginWhatsApp();
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notify: true }),
      });
      const result = await response.json();
      if (!response.ok) {
        popup?.close();
        notify(result.error ?? 'Could not prepare the WhatsApp update');
        return;
      }
      setLastMessage(result.whatsapp);
      setShowMessage(true);
      finishWhatsApp(popup, result.whatsapp);
    } catch {
      popup?.close();
      notify('Could not reach the server. Try again.');
    }
  };

  const togglePayment = async (order: Order) => {
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid: !order.paid }),
      });
      const result = await response.json();
      if (!response.ok) {
        notify(result.error ?? 'Could not update payment');
        return;
      }
      setOrders((current) => current.map((item) => item.id === order.id ? result.order : item));
      notify(`${result.order.code} marked ${result.order.paid ? 'paid' : 'due'}`);
    } catch {
      notify('Could not reach the server. Try again.');
    }
  };

  const addExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...expenseDraft, amount: Number(expenseDraft.amount) }),
      });
      const result = await response.json();
      if (!response.ok) {
        notify(result.error ?? 'Could not add the expense');
        return;
      }
      setExpenses((current) => [result.expense, ...current]);
      setExpenseDraft({ title: '', category: 'Supplies', amount: '' });
      notify('Expense saved');
    } catch {
      notify('Could not reach the server. Try again.');
    }
  };

  const copyTrackingLink = async () => {
    if (!lastMessage?.link) return;
    try {
      await navigator.clipboard.writeText(lastMessage.link);
      notify('Tracking link copied');
    } catch {
      notify('Could not copy the link. Select it from the message instead.');
    }
  };

  const selectSection = (section: Section) => {
    if (role === 'Counter staff' && (section === 'Reports' || section === 'Expenses')) {
      notify('This section is available to the owner');
      return;
    }
    setActive(section);
    setMenu(false);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.assign('/login');
  };

  const customers = useMemo(() => {
    const grouped = new Map<string, { name: string; phone: string; email: string; orders: number; spend: number; due: number; lastOrder: string }>();
    orders.forEach((order) => {
      const customer = grouped.get(order.email) ?? { name: order.name, phone: order.phone, email: order.email, orders: 0, spend: 0, due: 0, lastOrder: order.code };
      customer.orders += 1;
      customer.spend += order.total;
      if (!order.paid) customer.due += order.total;
      grouped.set(order.email, customer);
    });
    return [...grouped.values()].filter((customer) => `${customer.name} ${customer.phone} ${customer.email}`.toLowerCase().includes(query.toLowerCase()));
  }, [orders, query]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menu ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#" onClick={(event) => event.preventDefault()} aria-label="LaundryTrack home">
          <span className="brand-icon"><Shirt size={21} /></span>
          <span className="brand-copy"><b>Laundry<span>Track</span></b><small>COUNTER CONSOLE</small></span>
          <button className="icon-button close-menu" onClick={() => setMenu(false)} aria-label="Close menu"><X size={18} /></button>
        </a>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="navigation" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button className={`nav-link ${active === label ? 'nav-active' : ''}`} onClick={() => selectSection(label)} key={label}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {label === 'Orders' && <span className="nav-count">{orders.length}</span>}
              {role === 'Counter staff' && (label === 'Reports' || label === 'Expenses') && <ShieldCheck className="nav-lock" size={14} />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="role-card">
            <div className="role-icon"><ShieldCheck size={17} /></div>
            <div className="role-copy"><b>Verified access</b><small>{role === 'Owner' ? 'Owner permissions' : 'Counter permissions'}</small></div>
          </div>
          <button className="nav-link settings-link" onClick={() => notify('Settings workspace is coming soon')}><Settings size={18} /><span>Settings</span><ChevronRight size={15} /></button>
          <div className="profile">
            <div className="avatar">{userName.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
            <div className="profile-copy"><b>{userName}</b><small>{userEmail || role}</small></div>
            <span className="online-dot" aria-label="Online" />
          </div>
          <button className="nav-link logout-link" onClick={logout}><LogOut size={17} /><span>Sign out</span></button>
          <div className="creator-credit">Built by <b>Nirmal Kumar</b></div>
        </div>
      </aside>

      {menu && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMenu(false)} />}
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-heading">
            <button className="icon-button mobile-menu" onClick={() => setMenu(true)} aria-label="Open navigation"><Menu size={21} /></button>
            <div><div className="breadcrumb">LaundryTrack <ChevronRight size={13} /> <span>{active}</span></div><p><span className="connection-dot" /> Counter online</p></div>
          </div>
          <div className="topbar-actions">
            <span className="today-date">{new Intl.DateTimeFormat('en', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())}</span>
            <button className="notification-button" onClick={() => notify('You’re all caught up')} aria-label="Notifications"><Bell size={18} /><i /></button>
            <div className="topbar-user"><div className="avatar">{userName.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><div><b>{userName}</b><small>{role}</small></div><ChevronDown size={14} /></div>
          </div>
        </header>

        {!ready && <p className="loading-note">Loading the counter…</p>}
        {loadError && <p className="loading-note">{loadError}</p>}
        {ready && active === 'Orders' && (
          <>
            <section className="welcome-row">
              <div><div className="eyebrow"><Sparkles size={14} /> YOUR COUNTER, AT A GLANCE</div><h1>Good morning, {userName.split(' ')[0]} <span>☀️</span></h1><p>Here’s what’s happening at your laundry today.</p></div>
              <button className="primary-button" onClick={() => setShowNew(true)}><Plus size={18} /> New order <kbd>Ctrl N</kbd></button>
            </section>

            <section className="stats-grid" aria-label="Today's performance">
              <Stat icon={Banknote} label="Today's sales" value={money(sales)} detail="Total order value" tone="mint" />
              <Stat icon={ShoppingBag} label="Today's orders" value={String(todayOrders.length)} detail="Orders received today" tone="blue" />
              <Stat icon={Clock3} label="Pending" value={String(pendingCount)} detail={`${money(dueTotal)} payment due`} tone="amber" />
              <Stat icon={Check} label="Ready for pickup" value={String(readyCount)} detail="Let customers know" tone="violet" />
            </section>

            <section className="orders-section">
              <div className="section-heading"><div><h2>Orders</h2><p>Manage today’s laundry from one place.</p></div><span className="live-indicator"><span /> LIVE</span></div>
              <div className="orders-toolbar">
                <label className="search-box"><Search size={17} /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search order, customer or phone..." /><kbd>Ctrl K</kbd></label>
                <div className="toolbar-actions">
                  <label className="filter-select"><span>Status</span><select aria-label="Filter by order status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option><option>Received</option><option>Washing</option><option>Ironing</option><option>Ready</option></select><ChevronDown size={14} /></label>
                  <button className="filter-button" onClick={() => setStatusFilter('All statuses')}><X size={15} /> Clear</button>
                </div>
              </div>

              <div className="orders-card">
                <div className="orders-card-heading"><div><h3>Recent orders <span>{filteredOrders.length}</span></h3><p>Update order progress or payment as you go.</p></div><div className="table-meta"><span className="table-dot" /> Synced just now</div></div>
                <div className="table-scroll">
                  <div className="table-head"><span>ORDER</span><span>CUSTOMER</span><span>ITEMS</span><span>STATUS</span><span>PAYMENT</span><span>TOTAL</span><span /></div>
                  {filteredOrders.map((order) => (
                    <div className="order-row" key={order.id}>
                      <div className="order-number" data-label="Order"><b>{order.code}</b><small>{formatWhen(order.createdAt)}</small>{order.urgent && <span className="urgent-tag"><AlertTriangle size={12} /> Urgent</span>}</div>
                      <div className="customer-cell" data-label="Customer"><div className="avatar customer-avatar">{order.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><div><b>{order.name}</b><small>{order.phone}</small></div></div>
                      <div className="items-cell" data-label="Items"><b>{order.items}</b><small>{order.service}</small></div>
                      <div data-label="Status"><button className={`status-pill status-${order.status.toLowerCase()}`} onClick={() => advanceOrder(order)} title={order.status === 'Ready' ? 'Order ready' : 'Advance to next status'}>{order.status}{order.status !== 'Ready' && <ChevronDown size={13} />}</button></div>
                      <div data-label="Payment"><button className={`payment-pill ${order.paid ? 'payment-paid' : 'payment-due'}`} onClick={() => togglePayment(order)} title="Toggle payment status">{order.paid ? <><Check size={12} /> Paid</> : <><AlertTriangle size={12} /> Due</>}</button></div>
                      <div className="amount-cell" data-label="Total">{money(order.total)}</div>
                      <button className="row-more" aria-label={`Send WhatsApp update for ${order.code}`} title="Send WhatsApp update" onClick={() => sendUpdate(order)}><MessageCircle size={16} /></button>
                    </div>
                  ))}
                  {filteredOrders.length === 0 && <div className="empty-state"><Search size={23} /><b>{orders.length === 0 ? 'No orders yet' : 'No matching orders'}</b><span>{orders.length === 0 ? 'Create an order to send the customer a tracking link on WhatsApp.' : 'Try a different name, phone number or status.'}</span></div>}
                </div>
                <div className="orders-card-footer"><span>Showing <b>{filteredOrders.length}</b> of <b>{orders.length}</b> orders</span><button onClick={() => { setQuery(''); setStatusFilter('All statuses'); }}>View all orders <ChevronRight size={15} /></button></div>
              </div>
            </section>
          </>
        )}

        {ready && active === 'Customers' && <Customers customers={customers} query={query} setQuery={setQuery} />}
        {ready && active === 'Reports' && <Reports orders={orders} />}
        {ready && active === 'Expenses' && <Expenses expenses={expenses} sales={sales} expenseDraft={expenseDraft} setExpenseDraft={setExpenseDraft} addExpense={addExpense} />}
      </main>

      {showNew && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowNew(false); }}>
          <form className="modal-card new-order-modal" onSubmit={createOrder}>
            <div className="modal-heading"><div><span className="modal-kicker">QUICK CHECK-IN</span><h2>New order</h2><p>A complete counter ticket in under 30 seconds.</p></div><button type="button" className="icon-button" onClick={() => setShowNew(false)} aria-label="Close"><X size={19} /></button></div>
            <div className="customer-fields">
              <label className="field full-field">Customer name<input autoFocus required value={newOrder.name} onChange={(event) => setNewOrder({ ...newOrder, name: event.target.value })} placeholder="e.g. Mohammed Ali" /></label>
              <label className="field full-field">Phone / WhatsApp<input required type="tel" value={newOrder.phone} onChange={(event) => setNewOrder({ ...newOrder, phone: event.target.value })} placeholder="+91 98765 43210" /></label>
              <label className="field full-field">Customer email<input required type="email" value={newOrder.email} onChange={(event) => setNewOrder({ ...newOrder, email: event.target.value })} placeholder="customer@email.com" /></label>
              <label className="field">Items<input required value={newOrder.items} onChange={(event) => setNewOrder({ ...newOrder, items: event.target.value })} placeholder="e.g. 2 shirts, 1 suit" /></label>
              <label className="field">Service<select value={newOrder.service} onChange={(event) => setNewOrder({ ...newOrder, service: event.target.value })}><option>Wash &amp; Iron</option><option>Wash &amp; Fold</option><option>Dry Clean</option><option>Ironing only</option></select></label>
              <label className="field">Total (INR)<input required type="number" min="0.01" step="0.01" value={newOrder.total} onChange={(event) => setNewOrder({ ...newOrder, total: event.target.value })} placeholder="0.00" /></label>
              <label className="field">Payment<select value={newOrder.paid ? 'Paid' : 'Due'} onChange={(event) => setNewOrder({ ...newOrder, paid: event.target.value === 'Paid' })}><option>Due</option><option>Paid</option></select></label>
            </div>
            <label className="urgent-toggle"><input type="checkbox" checked={newOrder.urgent} onChange={(event) => setNewOrder({ ...newOrder, urgent: event.target.checked })} /><span className="urgent-toggle-icon"><AlertTriangle size={16} /></span><span><b>Mark as urgent</b><small>Highlight this order for the laundry team</small></span></label>
            <div className="whatsapp-preview"><div className="whatsapp-icon"><MessageCircle size={18} /></div><div><b>WhatsApp update</b><small>Saving this phone number prepares a WhatsApp message with the customer’s private tracking link.</small></div><span className="simulation-badge">WHATSAPP</span></div>
            <div className="modal-footer"><button type="button" className="secondary-button" onClick={() => setShowNew(false)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}><Plus size={17} /> {saving ? 'Creating…' : 'Create order'}</button></div>
          </form>
        </div>
      )}

      {showMessage && lastMessage && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowMessage(false); }}>
          <section className="modal-card message-modal">
            <div className="modal-heading"><div><span className="modal-kicker">ORDER UPDATE</span><h2>{lastMessage.sent ? 'WhatsApp sent' : 'Send on WhatsApp'}</h2><p>{lastMessage.sent ? 'The customer has the tracking link in WhatsApp.' : 'WhatsApp opens with this message ready. Press send there so the customer gets the tracking link.'}</p></div><button className="icon-button" onClick={() => setShowMessage(false)} aria-label="Close"><X size={19} /></button></div>
            <div className="message-phone"><MessageCircle size={16} /><span>To {lastMessage.phone}</span><span className="simulation-badge">{lastMessage.sent ? 'SENT' : 'READY'}</span></div>
            <div className="chat-bubble"><p>{lastMessage.text}</p><button type="button" className="tracking-link" onClick={copyTrackingLink}>{lastMessage.link}<span>Copy link</span></button><small>{lastMessage.notice || (lastMessage.sent ? 'Delivered through the WhatsApp gateway.' : 'Opens the shop WhatsApp chat with this customer.')}</small></div>
            <div className="wa-actions">{lastMessage.url && <a className="primary-button full-button" href={lastMessage.url} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} /> {lastMessage.sent ? 'Open WhatsApp chat' : 'Send on WhatsApp'}</a>}<button type="button" className="secondary-button full-button" onClick={() => setShowMessage(false)}>Close</button></div>
          </section>
        </div>
      )}
      {toast && <div className="toast" role="status"><Check size={16} />{toast}</div>}
    </div>
  );
}

function Stat({ icon: Icon, label, value, detail, tone }: { icon: LucideIcon; label: string; value: string; detail: string; tone: string }) {
  return <article className="stat-card"><span className={`stat-icon tone-${tone}`}><Icon size={18} /></span><div className="stat-content"><span className="stat-label">{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
}

type Customer = { name: string; phone: string; email: string; orders: number; spend: number; due: number; lastOrder: string };

function Customers({ customers, query, setQuery }: { customers: Customer[]; query: string; setQuery: (value: string) => void }) {
  return <section className="workspace-section">
    <div className="welcome-row page-welcome"><div><div className="eyebrow"><Users size={14} /> CUSTOMER DIRECTORY</div><h1>Customers</h1><p>Anyone added on an order, other than the owner and counter emails, is a customer.</p></div><span className="count-chip">{customers.length} customers</span></div>
    <div className="orders-card customer-card"><div className="orders-card-heading"><div><h3>All customers</h3><p>Each email can sign in and see their own orders.</p></div><label className="search-box compact-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a customer..." /></label></div>
      <div className="customer-list"><div className="customer-list-head"><span>CUSTOMER</span><span>ORDERS</span><span>TOTAL SPEND</span><span>OUTSTANDING</span><span>LAST ORDER</span></div>
        {customers.map((customer) => <div className="customer-list-row" key={customer.email}><div className="customer-cell"><div className="avatar customer-avatar">{customer.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><div><b>{customer.name}</b><small>{customer.phone} · {customer.email}</small></div></div><span>{customer.orders} {customer.orders === 1 ? 'order' : 'orders'}</span><b>{money(customer.spend)}</b><span className={customer.due ? 'customer-due' : 'customer-clear'}>{customer.due ? money(customer.due) : 'Clear'}</span><span>{customer.lastOrder}</span></div>)}
        {customers.length === 0 && <div className="empty-state"><Users size={23} /><b>No customers found</b><span>Customers appear here after an order is created.</span></div>}
      </div>
    </div>
    <div className="scaffold-note"><ShieldCheck size={16} /><span>Customer accounts are saved with their orders. They sign in with the email on the ticket, or they can open the WhatsApp tracking link without an account.</span></div>
  </section>;
}

function Reports({ orders }: { orders: Order[] }) {
  const today = orders.filter((order) => isToday(order.createdAt));
  const sales = today.reduce((sum, order) => sum + order.total, 0);
  const dueTotal = today.filter((order) => !order.paid).reduce((sum, order) => sum + order.total, 0);
  const paidTotal = sales - dueTotal;
  const statusCounts: { label: Status; className: string; count: number }[] = [
    { label: 'Received', className: 'bar-received', count: today.filter((order) => order.status === 'Received').length },
    { label: 'Washing', className: 'bar-washing', count: today.filter((order) => order.status === 'Washing').length },
    { label: 'Ironing', className: 'bar-ironing', count: today.filter((order) => order.status === 'Ironing').length },
    { label: 'Ready', className: 'bar-ready', count: today.filter((order) => order.status === 'Ready').length },
  ];
  return <section className="workspace-section">
    <div className="welcome-row page-welcome"><div><div className="eyebrow"><FileText size={14} /> BUSINESS OVERVIEW</div><h1>Reports</h1><p>A quick snapshot of today’s counter activity.</p></div><span className="count-chip"><span className="connection-dot" /> Today</span></div>
    <div className="stats-grid report-stats"><Stat icon={Banknote} label="Sales today" value={money(sales)} detail="Total order value" tone="mint" /><Stat icon={ShoppingBag} label="Orders today" value={String(today.length)} detail="All statuses" tone="blue" /><Stat icon={Check} label="Collected" value={money(paidTotal)} detail="Marked as paid" tone="violet" /><Stat icon={Clock3} label="Outstanding" value={money(dueTotal)} detail="Payment due" tone="amber" /></div>
    <div className="report-grid"><article className="orders-card report-card"><div className="orders-card-heading"><div><h3>Orders by status</h3><p>Orders created today</p></div><span className="report-icon"><ShoppingBag size={17} /></span></div><div className="status-report">{statusCounts.map((status) => <div className="status-report-row" key={status.label}><span>{status.label}</span><div className="report-bar-track"><i className={status.className} style={{ width: `${today.length ? Math.max(4, status.count / today.length * 100) : 0}%` }} /></div><b>{status.count}</b></div>)}</div></article>
      <article className="orders-card report-card"><div className="orders-card-heading"><div><h3>Payment summary</h3><p>Based on today’s orders</p></div><span className="report-icon report-icon-green"><Wallet size={17} /></span></div><div className="payment-summary"><div><span className="summary-dot summary-paid" />Collected <b>{money(paidTotal)}</b></div><div><span className="summary-dot summary-due" />Outstanding <b>{money(dueTotal)}</b></div><div className="payment-summary-total">Order value <b>{money(sales)}</b></div></div></article>
    </div>
    <div className="scaffold-note"><ShieldCheck size={16} /><span>These figures are saved on this server and stay after you sign out.</span></div>
  </section>;
}

function Expenses({ expenses, sales, expenseDraft, setExpenseDraft, addExpense }: { expenses: Expense[]; sales: number; expenseDraft: { title: string; category: string; amount: string }; setExpenseDraft: (value: { title: string; category: string; amount: string }) => void; addExpense: (event: React.FormEvent<HTMLFormElement>) => void }) {
  const todayExpenses = expenses.filter((expense) => isToday(expense.createdAt));
  const total = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  return <section className="workspace-section">
    <div className="welcome-row page-welcome"><div><div className="eyebrow"><Wallet size={14} /> COUNTER SPENDING</div><h1>Expenses</h1><p>Track everyday shop expenses alongside your orders.</p></div><span className="count-chip">{expenses.length} saved</span></div>
    <div className="stats-grid expense-stats"><Stat icon={Wallet} label="Today's expenses" value={money(total)} detail={`${todayExpenses.length} logged today`} tone="amber" /><Stat icon={Banknote} label="Sales today" value={money(sales)} detail="Total order value" tone="mint" /><Stat icon={ArrowDownRight} label="Net today" value={money(sales - total)} detail="Sales minus expenses" tone="blue" /><Stat icon={FileText} label="Categories" value={String(new Set(todayExpenses.map((expense) => expense.category)).size)} detail="Used today" tone="violet" /></div>
    <div className="report-grid expense-grid"><article className="orders-card expense-form-card"><div className="orders-card-heading"><div><h3>Log an expense</h3><p>Add a supply, delivery or shop expense.</p></div></div><form className="expense-form" onSubmit={addExpense}><label className="field">Description<input required value={expenseDraft.title} onChange={(event) => setExpenseDraft({ ...expenseDraft, title: event.target.value })} placeholder="e.g. Detergent purchase" /></label><label className="field">Category<select value={expenseDraft.category} onChange={(event) => setExpenseDraft({ ...expenseDraft, category: event.target.value })}><option>Supplies</option><option>Transport</option><option>Utilities</option><option>Rent</option><option>Other</option></select></label><label className="field">Amount (INR)<input required min="0.01" step="0.01" type="number" value={expenseDraft.amount} onChange={(event) => setExpenseDraft({ ...expenseDraft, amount: event.target.value })} placeholder="0.00" /></label><button type="submit" className="primary-button"><Plus size={17} /> Add expense</button></form></article>
      <article className="orders-card expense-list-card"><div className="orders-card-heading"><div><h3>Recent expenses</h3><p>Saved on this server.</p></div></div><div className="expense-list">{expenses.map((expense) => <div className="expense-row" key={expense.id}><span className="expense-icon"><Wallet size={16} /></span><div><b>{expense.title}</b><small>{expense.category} · {formatWhen(expense.createdAt)}</small></div><strong>− {money(expense.amount)}</strong></div>)}{expenses.length === 0 && <div className="empty-state"><Wallet size={23} /><b>No expenses yet</b><span>Add your first expense to get started.</span></div>}</div></article>
    </div>
    <div className="scaffold-note"><ShieldCheck size={16} /><span>Expenses stay saved on this server. Only the owner can open this section.</span></div>
  </section>;
}
