import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, ChevronRight, CircleDot, FilePlus2, Filter, Plus, Search, Settings2, XCircle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../layouts/index.js';
import { api } from '../services/api.js';
import { useAuth } from '../components/Auth.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/DataState.jsx';
import { PageHeader, ResourceCard, SectionLabel, StatCard, StatusPill } from '../components/Ui.jsx';

const RESOURCE_CATEGORIES = [
  { value: 'seminar-hall', label: 'Seminar halls' },
  { value: 'classroom', label: 'Classrooms' },
  { value: 'laboratory', label: 'Laboratories' },
  { value: 'other', label: 'Other institutional resources' }
];

const categoryLabel = (value) => RESOURCE_CATEGORIES.find((item) => item.value === value)?.label || value;
const today = () => new Date().toISOString().slice(0, 10);

function readSessionCache(key) {
  try {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function writeSessionCache(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* optional cache */ }
}

function useResourceList() {
  const cached = readSessionCache('acadbook.resources');
  const [state, setState] = useState({ status: cached ? 'ready' : 'loading', data: cached || [], error: null });
  const [filters, setFilters] = useState({ q: '', category: '', bookingMode: '', minCapacity: '' });
  const load = (nextFilters = filters) => {
    setState((current) => ({ ...current, status: 'loading', error: null }));
    api.resources(nextFilters).then((payload) => { const data = payload.data || []; writeSessionCache('acadbook.resources', data); setState({ status: 'ready', data, error: null }); }).catch((error) => setState((current) => ({ status: current.data.length ? 'ready' : 'error', data: current.data, error })));
  };
  useEffect(() => { load(); }, []);
  return { state, filters, setFilters, load };
}

export function RoleDashboard({ role }) {
  const prefix = role === 'admin' ? 'admin' : 'user';
  const meta = role === 'admin' ? { eyebrow: 'Operations overview', title: 'Keep the booking rail moving.', description: 'A focused view of the requests, resources, and people that need your attention.' } : { eyebrow: 'Academic access', title: 'Make space for the work that matters.', description: 'Browse facilities, submit booking requests, and keep track of every status.' };
  const cacheKey = `acadbook.dashboard.${role}`;
  const cached = readSessionCache(cacheKey);
  const [state, setState] = useState({ status: cached ? 'ready' : 'loading', data: cached, error: null });
  const load = () => { setState((current) => ({ status: current.data ? 'ready' : 'loading', data: current.data, error: null })); api.dashboardSummary().then((payload) => { writeSessionCache(cacheKey, payload.data); setState({ status: 'ready', data: payload.data, error: null }); }).catch((error) => setState((current) => ({ status: current.data ? 'ready' : 'error', data: current.data, error }))); };
  useEffect(load, []);
  return <AppShell role={role} title="Dashboard"><PageHeader eyebrow={meta.eyebrow} title={meta.title} description={meta.description} action={<Link className="button button-primary" to={`/${prefix}/resources`}>Browse resources <ArrowRight size={16} /></Link>} />{state.status === 'loading' && <LoadingState label="Loading live dashboard" />}{state.status === 'error' && <ErrorState error={state.error} onRetry={load} />}{state.status === 'ready' && <><div className="stats-grid"><StatCard label={role === 'admin' ? 'Open requests' : 'My pending requests'} value={state.data.pending} note="Pending Admin review" tone="saffron" /><StatCard label="Upcoming bookings" value={state.data.approved} note="Approved from today onward" tone="blue" /><StatCard label={role === 'admin' ? 'Live resources' : 'My booking history'} value={role === 'admin' ? state.data.resources : state.data.total} note={role === 'admin' ? `${state.data.users || 0} active users` : 'Persistent Atlas records'} tone="parchment" /></div><div className="dashboard-grid"><section className="panel panel-feature"><div className="panel-heading"><div><SectionLabel>Start here</SectionLabel><h2>{role === 'admin' ? 'Review the operation' : 'Build your next booking'}</h2></div><CircleDot size={19} /></div><div className="feature-list"><div><span className="feature-number">01</span><div><strong>{role === 'admin' ? 'Open booking requests' : 'Browse available resources'}</strong><p>{role === 'admin' ? `${state.data.pending} requests need a decision.` : 'Use live categories, capacity, and unit availability to choose a space.'}</p></div><Link to={`/${prefix}/${role === 'admin' ? 'requests' : 'resources'}`}><ChevronRight size={18} /></Link></div><div><span className="feature-number">02</span><div><strong>{state.data.nextBooking ? 'Next approved booking' : 'No upcoming booking yet'}</strong><p>{state.data.nextBooking ? `${state.data.nextBooking.resourceId?.name} · ${state.data.nextBooking.date} · ${state.data.nextBooking.startTime}` : 'Approved bookings will appear here after review.'}</p></div><Link to={`/${prefix}/${role === 'admin' ? 'bookings' : 'bookings'}`}><ChevronRight size={18} /></Link></div></div></section><section className="panel panel-note"><span className="eyebrow">Live Atlas summary</span><h3>{state.data.resources} resources are available.</h3><p>Counts are derived from your institution-scoped MongoDB records. Pending requests do not reserve resources.</p><div className="note-rule" /><small>MongoDB Atlas · Mongoose · Express</small></section></div></>}</AppShell>;
}

export function BrowseResourcesPage({ role }) {
  const { state, filters, setFilters, load } = useResourceList();
  const submit = (event) => { event.preventDefault(); load(); };
  return <AppShell role={role} title="Browse resources"><PageHeader eyebrow="Resource library" title="Find the right room, lab, or studio." description="Search live inventory by category, capacity, and booking mode. Availability is checked again when a request is reviewed." action={<Link className="button button-quiet" to={`/${role}/bookings`}><CalendarClock size={16} /> My bookings</Link>} /><form className="filter-bar" onSubmit={submit}><div className="filter-input"><Search size={17} /><input value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Search resources" aria-label="Search resources" /></div><select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })} aria-label="Filter by category"><option value="">All categories</option>{RESOURCE_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><select value={filters.bookingMode} onChange={(event) => setFilters({ ...filters, bookingMode: event.target.value })} aria-label="Filter by booking mode"><option value="">All booking modes</option><option value="resource">Whole resource</option><option value="unit">Individual units</option><option value="both">Whole resource or units</option></select><input className="capacity-filter" type="number" min="1" value={filters.minCapacity} onChange={(event) => setFilters({ ...filters, minCapacity: event.target.value })} placeholder="Min capacity" aria-label="Minimum capacity" /><button className="button button-primary" type="submit">Search</button><button className="button button-quiet" type="button" onClick={() => { const empty = { q: '', category: '', bookingMode: '', minCapacity: '' }; setFilters(empty); load(empty); }}><Filter size={16} /> Clear</button></form><div className="results-line"><span>{filters.q ? `Results for “${filters.q}”` : 'All live resources'}</span><span className="results-count">{state.status === 'ready' ? `${state.data.length} listed` : 'Awaiting data'}</span></div>{state.status === 'loading' && <LoadingState label="Loading resource inventory" />}{state.status === 'error' && <ErrorState error={state.error} onRetry={load} />}{state.status === 'ready' && state.data.length === 0 && <EmptyState title="No live resources to show" description="Ask an administrator to publish the first resource or adjust your filters." />}{state.status === 'ready' && state.data.length > 0 && <div className="resource-grid">{state.data.map((resource) => <ResourceCard key={resource._id} resource={resource} role={role} />)}</div>}</AppShell>;
}

export function ResourceDetailsPage({ role }) {
  const { resourceId } = useParams();
  const cachedResource = readSessionCache('acadbook.resources')?.find((item) => item._id === resourceId) || null;
  const [state, setState] = useState({ status: cachedResource ? 'ready' : 'loading', data: cachedResource, error: null });
  useEffect(() => { api.resource(resourceId).then((payload) => { writeSessionCache('acadbook.resources', [...(readSessionCache('acadbook.resources') || []).filter((item) => item._id !== resourceId), payload.data]); setState({ status: 'ready', data: payload.data, error: null }); }).catch((error) => setState((current) => ({ status: current.data ? 'ready' : 'error', data: current.data, error }))); }, [resourceId]);
  if (state.status === 'loading') return <AppShell role={role} title="Resource details"><LoadingState label="Opening resource details" /></AppShell>;
  if (state.status === 'error') return <AppShell role={role} title="Resource details"><ErrorState error={state.error} /></AppShell>;
  const resource = state.data;
  return <AppShell role={role} title="Resource details"><Link className="back-link dark-back" to={`/${role}/resources`}>← Back to resources</Link><section className="detail-layout"><div className="detail-main"><div className="detail-kicker">{categoryLabel(resource.category)}</div><h1>{resource.name}</h1><p className="detail-lead">{resource.description}</p><div className="detail-facts"><span><strong>Capacity</strong>{resource.capacity} people</span><span><strong>Location</strong>{resource.location}</span><span><strong>Booking</strong>{resource.bookingMode === 'resource' ? 'Entire resource' : resource.bookingMode === 'unit' ? 'Individual units' : 'Resource or unit'}</span></div><div className="detail-section"><span className="eyebrow">{resource.units?.length ? 'Available units' : 'Included equipment'}</span><h2>{resource.units?.length ? `${resource.units.length} bookable units` : 'What is already there'}</h2>{resource.units?.length ? <div className="tag-list">{resource.units.map((unit) => <span key={unit.unitId}>{unit.label}</span>)}</div> : resource.equipment?.length ? <div className="tag-list">{resource.equipment.map((item) => <span key={item}>{item}</span>)}</div> : <EmptyState title="Details not published" description="An Admin can add equipment details when editing this resource." />}</div></div><aside className="booking-aside"><span className="eyebrow">Next step</span><h3>Check a live time window.</h3><p>Pending requests do not reserve a resource. Approval rechecks the selected scope against approved bookings.</p><Link className="button button-primary button-full" to={`/${role}/resources/${resource._id}/book`}>Check availability <ArrowRight size={16} /></Link></aside></section></AppShell>;
}

export function BookingRequestPage({ role }) {
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const cachedResource = readSessionCache('acadbook.resources')?.find((item) => item._id === resourceId) || null;
  const [resource, setResource] = useState(cachedResource);
  const [form, setForm] = useState({ date: today(), startTime: '', endTime: '', purpose: '', bookingScope: cachedResource?.bookingMode === 'unit' ? 'unit' : 'resource', unitId: '' });
  const [availability, setAvailability] = useState({ status: 'idle', data: null, error: null });
  const [status, setStatus] = useState({ state: cachedResource ? 'idle' : 'loading', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictModal, setConflictModal] = useState(null);
  const [conflictSuggestions, setConflictSuggestions] = useState([]);
  const dismissedConflictKey = useRef('');
  const suggestionPanelRef = useRef(null);
  const closeConflictRef = useRef(null);

  const conflictKey = (detail) => detail ? [detail.date, detail.startTime, detail.endTime, detail.bookingScope, detail.unitId || 'resource'].join('|') : '';
  const showConflict = (detail, suggestions = []) => {
    if (!detail) return;
    const key = conflictKey(detail);
    setConflictSuggestions(suggestions);
    if (dismissedConflictKey.current !== key) setConflictModal(detail);
  };
  const closeConflict = () => { dismissedConflictKey.current = conflictKey(conflictModal); setConflictModal(null); };

  useEffect(() => {
    if (!conflictModal) return undefined;
    closeConflictRef.current?.focus();
    const onKeyDown = (event) => { if (event.key === 'Escape') closeConflict(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [conflictModal]);

  useEffect(() => {
    let active = true;
    api.resource(resourceId).then((payload) => {
      if (!active) return;
      const resources = readSessionCache('acadbook.resources') || [];
      writeSessionCache('acadbook.resources', [...resources.filter((item) => item._id !== resourceId), payload.data]);
      setResource(payload.data);
      setForm((current) => ({ ...current, bookingScope: payload.data.bookingMode === 'unit' ? 'unit' : current.bookingScope }));
      setStatus({ state: 'idle', message: '' });
    }).catch((error) => active && setStatus((current) => ({ state: current.state === 'idle' ? 'idle' : 'error', message: error.message })));
    return () => { active = false; };
  }, [resourceId]);

  useEffect(() => {
    if (!form.date || !form.startTime || !form.endTime) { setAvailability({ status: 'idle', data: null, error: null }); return undefined; }
    let active = true;
    const refresh = async () => {
      try {
        const payload = await api.availability(resourceId, form);
        if (!active) return;
        const data = payload.data;
        setAvailability({ status: 'ready', data, error: null });
        if (data.conflict) showConflict(data.conflict, data.suggestions || []);
        else { setConflictModal(null); setConflictSuggestions([]); dismissedConflictKey.current = ''; }
      } catch (error) { if (active) setAvailability((current) => ({ status: 'error', data: current.data, error })); }
    };
    refresh();
    const interval = window.setInterval(refresh, 20000);
    window.addEventListener('focus', refresh);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [resourceId, form.date, form.startTime, form.endTime, form.bookingScope, form.unitId]);

  const selectSuggestion = (suggestion) => {
    closeConflict();
    setForm((current) => ({ ...current, date: suggestion.date, startTime: suggestion.startTime, endTime: suggestion.endTime, unitId: suggestion.unitId || current.unitId }));
    setAvailability((current) => ({ ...current, status: 'loading' }));
    window.setTimeout(() => suggestionPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  };
  const submit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true); setStatus({ state: 'idle', message: '' });
    try {
      const current = await api.availability(resourceId, form);
      setAvailability({ status: 'ready', data: current.data, error: null });
      if (current.data.conflict) { showConflict(current.data.conflict, current.data.suggestions || []); return; }
      const selectedUnit = current.data.units?.find((unit) => unit.unitId === form.unitId);
      const available = form.bookingScope === 'resource' ? current.data.resourceAvailable : selectedUnit?.isAvailable;
      if (!available) throw new Error('This selection is not available. Choose another time or resource.');
      const payload = await api.createBooking({ ...form, resourceId });
      navigate(`/${role}/bookings/${payload.data._id}/confirmation`);
    } catch (error) {
      if (error.code === 'BOOKING_CONFLICT') {
        const detail = error.conflict || { date: form.date, startTime: form.startTime, endTime: form.endTime, bookingScope: form.bookingScope, unitId: form.unitId || null };
        setConflictSuggestions(error.suggestions || []);
        setConflictModal(detail);
      }
      else setStatus({ state: 'error', message: error.message });
    } finally { setIsSubmitting(false); }
  };

  if (!resource && status.state === 'loading') return <AppShell role={role} title="Booking request"><LoadingState label="Opening booking form" /></AppShell>;
  if (!resource) return <AppShell role={role} title="Booking request"><ErrorState error={{ message: status.message || 'Resource details could not be loaded.' }} /></AppShell>;
  const units = availability.data?.units || resource.units || [];
  const suggestions = conflictSuggestions.length ? conflictSuggestions : (availability.data?.suggestions || []);
  return <AppShell role={role} title="Booking request">
    <Link className="back-link dark-back" to={`/${role}/resources/${resourceId}`}>← Back to resource</Link>
    <div className="booking-layout"><div><span className="eyebrow">Availability and booking request</span><h1>{resource.name}</h1><p className="detail-lead">Pick a focused time window. Your request remains pending until an Admin reviews it.</p><div className="booking-summary"><span>Resource</span><strong>{resource.name}</strong><small>{resource.location} · {categoryLabel(resource.category)}</small></div>{availability.status === 'error' && <ErrorState error={availability.error} />}{availability.status === 'ready' && <div ref={suggestionPanelRef}><div className={availability.data.requestedAvailable ? 'inline-success' : 'inline-error'}>{form.bookingScope === 'resource' ? (availability.data.resourceAvailable ? 'This whole resource is available for the selected window.' : 'An approved booking overlaps this whole-resource window.') : `${availability.data.units.filter((unit) => unit.isAvailable).length} unit(s) are available for the selected window.`}</div>{suggestions.length > 0 && <div className="suggestion-panel"><strong>Nearby available times</strong><div className="suggestion-list">{suggestions.map((suggestion) => <button className="suggestion-chip" type="button" key={`${suggestion.date}-${suggestion.startTime}-${suggestion.unitId || 'resource'}`} onClick={() => selectSuggestion(suggestion)}>{suggestion.label}</button>)}</div></div>}{availability.data.checkedAt && <small className="availability-note">Live availability checked {new Date(availability.data.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>}</div>}</div><form className="form-card form-card-dark" onSubmit={submit}><label>Date<input required min={today()} type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><div className="form-row"><label>Start time<input required type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></label><label>End time<input required type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} /></label></div>{resource.bookingMode !== 'resource' && <label>Booking scope<select value={form.bookingScope} onChange={(event) => setForm({ ...form, bookingScope: event.target.value, unitId: '' })}><option value="unit">Individual seat/workstation</option>{resource.bookingMode === 'both' && <option value="resource">Entire resource</option>}</select></label>}{form.bookingScope === 'unit' && <label>Unit/workstation<select required value={form.unitId} onChange={(event) => setForm({ ...form, unitId: event.target.value })}><option value="">Select an available unit</option>{units.filter((unit) => unit.isAvailable).map((unit) => <option key={unit.unitId} value={unit.unitId}>{unit.label} · {unit.kind}</option>)}</select></label>}<label>Purpose<textarea required value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} placeholder="What will this session support?" rows="4" /></label>{status.state === 'error' && <div className="inline-error">{status.message}</div>}<button className="button button-primary button-full" disabled={isSubmitting} type="submit">Submit booking request <ArrowRight size={17} /></button><p className="form-footnote">Availability is checked instantly from the latest approved records, then revalidated securely when submitted.</p></form></div>
    {conflictModal && <div className="conflict-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeConflict(); }}><section className="conflict-modal" role="dialog" aria-modal="true" aria-labelledby="conflict-title" aria-describedby="conflict-message"><div className="conflict-icon" aria-hidden="true"><AlertTriangle size={28} /></div><span className="eyebrow">Booking conflict</span><h2 id="conflict-title">Oops! The slot is already booked.</h2><p id="conflict-message">This resource or individual unit is already booked for the selected time. Choose another slot to continue.</p><div className="conflict-details"><span><strong>Resource</strong>{resource.name}</span><span><strong>Date</strong>{conflictModal.date}</span><span><strong>Reserved time</strong>{conflictModal.startTime}–{conflictModal.endTime}</span>{conflictModal.unitId && <span><strong>Reserved unit</strong>{conflictModal.unitId}</span>}{conflictModal.bookerName && <span><strong>Booked by</strong>{conflictModal.bookerName}</span>}</div><div className="conflict-modal-suggestions">{conflictSuggestions.length > 0 ? <><strong>Available alternatives for the same duration</strong><div className="suggestion-list">{conflictSuggestions.map((suggestion) => <button className="suggestion-chip" type="button" key={`modal-${suggestion.date}-${suggestion.startTime}-${suggestion.unitId || 'resource'}`} onClick={() => selectSuggestion(suggestion)}>{suggestion.label}</button>)}</div></> : <span>No nearby available time was found within this resource's operating hours.</span>}</div><div className="conflict-actions"><button className="button button-primary" type="button" onClick={() => { closeConflict(); window.setTimeout(() => suggestionPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0); }}>Choose Another Slot</button><button className="button button-quiet" type="button" onClick={() => navigate(`/${role}/resources`)}>Choose Another Resource</button><button ref={closeConflictRef} className="button button-quiet" type="button" onClick={closeConflict}>Close</button></div></section></div>}
  </AppShell>;
}

export function BookingConfirmationPage({ role }) {
  const { bookingId } = useParams();
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  useEffect(() => { api.booking(bookingId).then((payload) => setState({ status: 'ready', data: payload.data, error: null })).catch((error) => setState({ status: 'error', data: null, error })); }, [bookingId]);
  if (state.status === 'loading') return <AppShell role={role} title="Booking confirmation"><LoadingState label="Loading booking confirmation" /></AppShell>;
  if (state.status === 'error') return <AppShell role={role} title="Booking confirmation"><ErrorState error={state.error} /></AppShell>;
  const booking = state.data;
  const headline = booking.status === 'rejected' ? 'This request was not approved.' : booking.status === 'approved' ? 'Your booking is approved.' : booking.status === 'cancelled' ? 'This booking was cancelled.' : 'Your booking is in the queue.';
  return <AppShell role={role} title="Booking confirmation"><div className="confirmation-card"><div className="confirmation-mark">{booking.status === 'rejected' ? <XCircle size={28} /> : <CheckCircle2 size={28} />}</div><span className="eyebrow">Booking request {booking.status}</span><h1>{headline}</h1><p>Reference <strong>{booking._id}</strong> · {booking.date} · {booking.startTime}–{booking.endTime}</p>{booking.rejectionReason && <div className="inline-error">Rejection reason: {booking.rejectionReason}</div>}<div className="confirmation-actions"><Link className="button button-primary" to={`/${role}/bookings`}>View my bookings <ArrowRight size={16} /></Link><Link className="button button-quiet" to={`/${role}/resources`}>Browse more resources</Link></div></div></AppShell>;
}

export function MyBookingsPage({ role }) {
  const [state, setState] = useState({ status: 'loading', data: [], error: null });
  const [action, setAction] = useState({});
  const load = () => { setState({ status: 'loading', data: [], error: null }); api.bookings().then((payload) => setState({ status: 'ready', data: payload.data || [], error: null })).catch((error) => setState({ status: 'error', data: [], error })); };
  useEffect(load, [role]);
  const cancel = async (bookingId) => { setAction({ [bookingId]: 'loading' }); try { await api.cancelBooking(bookingId); load(); } catch (error) { setAction({ [bookingId]: error.message }); } };
  return <AppShell role={role} title="My bookings"><PageHeader eyebrow="Booking history" title="Keep every request in sight." description="Every request is persisted in MongoDB Atlas with its current review status and any rejection reason." action={<Link className="button button-primary" to={`/${role}/resources`}>New request <Plus size={16} /></Link>} />{state.status === 'loading' && <LoadingState label="Loading your bookings" />}{state.status === 'error' && <ErrorState error={state.error} onRetry={load} />}{state.status === 'ready' && state.data.length === 0 && <EmptyState title="No bookings yet" description="Your first request will show up here with its status and time window." />}{state.status === 'ready' && state.data.length > 0 && <div className="table-card booking-table"><div className="table-head"><span>Resource</span><span>Date</span><span>Time / scope</span><span>Status</span><span>Action</span></div>{state.data.map((booking) => <div className="table-row" key={booking._id}><strong>{booking.resourceId?.name || 'Resource request'}<small>{booking.bookingScope === 'unit' ? `Unit ${booking.unitId}` : 'Entire resource'}</small></strong><span>{booking.date}</span><span>{booking.startTime}–{booking.endTime}</span><span><StatusPill status={booking.status} />{booking.rejectionReason && <small className="row-note">{booking.rejectionReason}</small>}</span><span>{['pending', 'approved'].includes(booking.status) && <button className="text-button" type="button" onClick={() => cancel(booking._id)} disabled={action[booking._id] === 'loading'}>{action[booking._id] === 'loading' ? 'Cancelling…' : 'Cancel'}</button>}{action[booking._id] && action[booking._id] !== 'loading' && <small className="row-note">{action[booking._id]}</small>}</span></div>)}</div>}</AppShell>;
}

export function ProfilePage({ role }) { const { user } = useAuth(); const label = role === 'admin' ? 'Admin' : 'User'; const displayName = user?.name || 'Registered user'; const initials = displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(); return <AppShell role={role} title="My profile"><PageHeader eyebrow="Profile" title="Keep your details ready." description="Your registered account details and institution affiliation appear here." /><div className="profile-layout"><section className="profile-card"><div className="avatar avatar-large">{initials || (role === 'admin' ? 'AD' : 'US')}</div><span className="eyebrow">{label}</span><h2>{displayName}</h2><p>{user?.email || 'Email unavailable'}</p><div className="profile-meta"><span>Institution</span><strong>{user?.institutionSlug || 'Institution unavailable'}</strong></div><button className="button button-quiet" type="button" disabled><Settings2 size={16} /> Edit profile</button></section><section className="panel"><span className="eyebrow">Account checklist</span><h2>What will live here next</h2><div className="check-list dark-check"><span><CheckCircle2 size={17} /> Institution affiliation</span><span><CheckCircle2 size={17} /> Contact and notification preferences</span><span><CheckCircle2 size={17} /> Booking history and saved resources</span></div></section></div></AppShell>; }

export function AdminRequestsPage() { const [state, setState] = useState({ status: 'loading', data: [], error: null }); const load = () => { setState({ status: 'loading', data: [], error: null }); api.bookings({ status: 'pending' }).then((payload) => setState({ status: 'ready', data: payload.data || [], error: null })).catch((error) => setState({ status: 'error', data: [], error })); }; useEffect(load, []); return <AppShell role="admin" title="Booking requests"><PageHeader eyebrow="Admin queue" title="Requests waiting for a decision." description="Approval rechecks live Atlas availability and rejects overlapping approved scope." />{state.status === 'loading' && <LoadingState label="Loading booking requests" />}{state.status === 'error' && <ErrorState error={state.error} onRetry={load} />}{state.status === 'ready' && state.data.length === 0 && <EmptyState title="The request queue is clear" description="Pending booking requests will appear here from MongoDB Atlas." />}{state.status === 'ready' && state.data.length > 0 && <div className="request-list">{state.data.map((booking) => <Link className="request-row" key={booking._id} to={`/admin/requests/${booking._id}`}><div><span className="eyebrow">{booking.requesterRole} · {booking.bookingScope === 'unit' ? `Unit ${booking.unitId}` : 'Entire resource'}</span><strong>{booking.resourceId?.name || 'Resource request'}</strong><p>{booking.purpose}</p></div><div><span>{booking.date}</span><StatusPill status={booking.status} /><ChevronRight size={18} /></div></Link>)}</div>}</AppShell>; }

export function AdminRequestDetailsPage() { const { bookingId } = useParams(); const [state, setState] = useState({ status: 'loading', data: null, error: null }); const [actionState, setActionState] = useState('idle'); const [rejectionReason, setRejectionReason] = useState(''); useEffect(() => { api.booking(bookingId).then((payload) => setState({ status: 'ready', data: payload.data, error: null })).catch((error) => setState({ status: 'error', data: null, error })); }, [bookingId]); const updateStatus = async (status) => { setActionState('loading'); try { const payload = await api.updateBookingStatus(bookingId, status, rejectionReason); setState({ status: 'ready', data: payload.data, error: null }); setActionState('success'); } catch (error) { setActionState(error.message); } }; if (state.status === 'loading') return <AppShell role="admin" title="Request details"><LoadingState /></AppShell>; if (state.status === 'error') return <AppShell role="admin" title="Request details"><ErrorState error={state.error} /></AppShell>; const booking = state.data; return <AppShell role="admin" title="Request details"><Link className="back-link dark-back" to="/admin/requests">← Back to requests</Link><div className="detail-layout"><div className="detail-main"><span className="eyebrow">Booking request detail</span><h1>{booking.resourceId?.name || 'Resource request'}</h1><p className="detail-lead">{booking.purpose}</p><div className="detail-facts"><span><strong>Requester</strong>{booking.requesterName} · {booking.requesterRole}</span><span><strong>Date</strong>{booking.date}</span><span><strong>Time</strong>{booking.startTime}–{booking.endTime}</span><span><strong>Scope</strong>{booking.bookingScope === 'unit' ? `Unit ${booking.unitId}` : 'Entire resource'}</span></div></div><aside className="booking-aside"><StatusPill status={booking.status} /><h3>Review this request.</h3><p>Pending requests do not reserve inventory. Approve only after the backend rechecks approved conflicts.</p>{booking.status === 'pending' && <><label>Rejection reason<textarea rows="3" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Required when rejecting" /></label><div className="stacked-actions"><button className="button button-primary button-full" onClick={() => updateStatus('approved')}>Approve request</button><button className="button button-danger button-full" onClick={() => updateStatus('rejected')}>Reject request</button></div></>}{booking.rejectionReason && <div className="inline-error">Rejection reason: {booking.rejectionReason}</div>}{actionState === 'success' && <div className="inline-success">Status updated.</div>}{actionState !== 'idle' && actionState !== 'loading' && actionState !== 'success' && <div className="inline-error">{actionState}</div>}</aside></div></AppShell>; }

export function AdminBookingsPage() { return <AdminTablePage title="All bookings" eyebrow="Operations ledger" description="A complete view of persistent booking activity, including cancellations and rejection reasons." params={{}} emptyTitle="No booking records yet" emptyDescription="Approved, rejected, cancelled, and pending records will appear here." />; }

function AdminTablePage({ title, eyebrow, description, params, emptyTitle, emptyDescription }) { const [state, setState] = useState({ status: 'loading', data: [], error: null }); const load = () => { setState({ status: 'loading', data: [], error: null }); api.bookings(params).then((payload) => setState({ status: 'ready', data: payload.data || [], error: null })).catch((error) => setState({ status: 'error', data: [], error })); }; useEffect(load, []); return <AppShell role="admin" title={title}><PageHeader eyebrow={eyebrow} title={title} description={description} />{state.status === 'loading' && <LoadingState label={`Loading ${title.toLowerCase()}`} />}{state.status === 'error' && <ErrorState error={state.error} onRetry={load} />}{state.status === 'ready' && state.data.length === 0 && <EmptyState title={emptyTitle} description={emptyDescription} />}{state.status === 'ready' && state.data.length > 0 && <div className="table-card"><div className="table-head"><span>Resource</span><span>Requester</span><span>Date</span><span>Status</span><span>Scope</span></div>{state.data.map((booking) => <div className="table-row" key={booking._id}><strong>{booking.resourceId?.name || 'Resource request'}</strong><span>{booking.requesterName}</span><span>{booking.date}</span><StatusPill status={booking.status} /><span>{booking.bookingScope === 'unit' ? `Unit ${booking.unitId}` : 'Entire resource'}</span></div>)}</div>}</AppShell>; }

export function AdminResourcesPage() { const [state, setState] = useState({ status: 'loading', data: [], error: null }); const load = () => { setState({ status: 'loading', data: [], error: null }); api.resources().then((payload) => setState({ status: 'ready', data: payload.data || [], error: null })).catch((error) => setState({ status: 'error', data: [], error })); }; useEffect(load, []); return <AppShell role="admin" title="Resource management"><PageHeader eyebrow="Inventory management" title="Keep the resource layer accurate." description="Manage seminar halls, classrooms, laboratories, and other institution-owned resources." action={<Link className="button button-primary" to="/admin/resources/new"><FilePlus2 size={16} /> Add resource</Link>} />{state.status === 'loading' && <LoadingState label="Loading resource inventory" />}{state.status === 'error' && <ErrorState error={state.error} onRetry={load} />}{state.status === 'ready' && state.data.length === 0 && <EmptyState title="No resources have been published" description="Add the first live resource when Atlas is configured." />}{state.status === 'ready' && state.data.length > 0 && <div className="resource-admin-list">{state.data.map((resource) => <div className="admin-resource-row" key={resource._id}><div><span className="resource-category">{categoryLabel(resource.category)}</span><h3>{resource.name}</h3><p>{resource.location} · {resource.bookingMode === 'resource' ? 'Whole resource' : `${resource.units?.length || 0} units supported`}</p></div><Link className="button button-quiet" to={`/admin/resources/${resource._id}/edit`}>Edit <ArrowRight size={15} /></Link></div>)}</div>}</AppShell>; }

function parseUnits(value) { return String(value || '').split('\n').map((line) => line.trim()).filter(Boolean).map((line, index) => { const [unitId, label, kind = 'workstation'] = line.split('|').map((item) => item.trim()); return { unitId: unitId || `unit-${index + 1}`, label: label || unitId || `Unit ${index + 1}`, kind, isAvailable: true }; }); }
function unitsText(units = []) { return units.map((unit) => `${unit.unitId}|${unit.label}|${unit.kind || 'workstation'}`).join('\n'); }

export function AdminResourceEditorPage({ mode = 'create' }) { const { resourceId } = useParams(); const navigate = useNavigate(); const [form, setForm] = useState({ name: '', category: 'classroom', description: '', capacity: 1, location: '', equipment: '', bookingMode: 'resource', units: '' }); const [state, setState] = useState({ status: mode === 'edit' ? 'loading' : 'idle', message: '' }); useEffect(() => { if (mode === 'edit') api.resource(resourceId).then((payload) => setForm({ ...payload.data, equipment: (payload.data.equipment || []).join(', '), units: unitsText(payload.data.units) })).catch((error) => setState({ status: 'error', message: error.message })); }, [mode, resourceId]); const submit = async (event) => { event.preventDefault(); setState({ status: 'loading', message: '' }); const payload = { ...form, capacity: Number(form.capacity), equipment: form.equipment.split(',').map((item) => item.trim()).filter(Boolean), units: parseUnits(form.units) }; try { if (mode === 'edit') await api.updateResource(resourceId, payload); else await api.createResource(payload); navigate('/admin/resources'); } catch (error) { setState({ status: 'error', message: error.message }); } }; if (state.status === 'loading' && mode === 'edit' && !form.name) return <AppShell role="admin" title="Resource editor"><LoadingState /></AppShell>; return <AppShell role="admin" title={mode === 'edit' ? 'Edit resource' : 'Add resource'}><Link className="back-link dark-back" to="/admin/resources">← Back to resource management</Link><div className="editor-layout"><div><span className="eyebrow">{mode === 'edit' ? 'Edit resource' : 'New resource'}</span><h1>{mode === 'edit' ? 'Keep the listing honest.' : 'Give a useful space a clear home.'}</h1><p className="detail-lead">Resources write to MongoDB Atlas and become available to institution-scoped Users.</p></div><form className="form-card" onSubmit={submit}><label>Resource name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Central seminar hall" /></label><div className="form-row"><label>Category<select required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{RESOURCE_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>Capacity<input required type="number" min="1" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} /></label></div><label>Booking mode<select value={form.bookingMode} onChange={(event) => setForm({ ...form, bookingMode: event.target.value })}><option value="resource">Entire resource</option><option value="unit">Individual units/workstations</option><option value="both">Entire resource or units</option></select></label>{form.bookingMode !== 'resource' && <label>Units <span className="label-hint">one per line: unit-id | label | kind</span><textarea required rows="5" value={form.units} onChange={(event) => setForm({ ...form, units: event.target.value })} placeholder="seat-01 | Seat 01 | workstation" /></label>}<label>Location<input required value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Block A · Level 2" /></label><label>Description<textarea required rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What can this resource support?" /></label><label>Equipment <span className="label-hint">comma separated</span><input value={form.equipment} onChange={(event) => setForm({ ...form, equipment: event.target.value })} placeholder="Projector, whiteboard" /></label>{state.status === 'error' && <div className="inline-error">{state.message}</div>}<button className="button button-primary button-full" type="submit">{mode === 'edit' ? 'Save resource' : 'Publish resource'} <ArrowRight size={16} /></button></form></div></AppShell>; }

export function AdminUsersPage() { const [state, setState] = useState({ status: 'loading', data: [], error: null }); const load = () => { setState({ status: 'loading', data: [], error: null }); api.users().then((payload) => setState({ status: 'ready', data: payload.data || [], error: null })).catch((error) => setState({ status: 'error', data: [], error })); }; useEffect(load, []); return <AppShell role="admin" title="Users directory"><PageHeader eyebrow="People directory" title="Know who has access." description="Users are loaded from the institution-scoped MongoDB collection." />{state.status === 'loading' && <LoadingState label="Loading users" />}{state.status === 'error' && <ErrorState error={state.error} onRetry={load} />}{state.status === 'ready' && state.data.length === 0 && <EmptyState title="No user records yet" description="Registration records will appear here for Admin review." />}{state.status === 'ready' && state.data.length > 0 && <div className="table-card"><div className="table-head"><span>Name</span><span>Institution</span><span>Role</span><span>Status</span></div>{state.data.map((user) => <div className="table-row" key={user._id}><strong>{user.name}</strong><span>{user.institutionSlug}</span><span>{user.role}</span><StatusPill status={user.status} /></div>)}</div>}</AppShell>; }
