import { useEffect, useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, Search, ShieldCheck, UsersRound } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PublicShell } from '../layouts/index.js';
import { api } from '../services/api.js';
import { EmptyState, ErrorState, LoadingState } from '../components/DataState.jsx';
import { InstitutionCard, PageHeader, SectionLabel } from '../components/Ui.jsx';
import { useAuth } from '../components/Auth.jsx';

export function HomePage() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [state, setState] = useState({ status: 'loading', data: [], error: null });
  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, status: 'loading', error: null }));
    api.institutions(submittedQuery).then((payload) => active && setState({ status: 'ready', data: payload.data || [], error: null })).catch((error) => active && setState({ status: 'error', data: [], error }));
    return () => { active = false; };
  }, [submittedQuery]);

  return <PublicShell><main className="public-main">
    <section className="hero-section hero-minimal"><div className="hero-copy"><h1>Reserve the space you need.</h1><p>Rooms, labs, and studios for academic work.</p></div></section>
    <section className="directory-section" id="directory"><div className="section-heading"><div><SectionLabel>Institution directory</SectionLabel><h2>Choose your academic home</h2></div></div><form className="search-bar" onSubmit={(event) => { event.preventDefault(); setSubmittedQuery(query); }}><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by institution or location" aria-label="Search institutions" /><button className="button button-primary" type="submit">Search</button></form>{state.status === 'loading' && <LoadingState label="Loading institutions" />}{state.status === 'error' && <ErrorState error={state.error} onRetry={() => setSubmittedQuery((value) => value)} />}{state.status === 'ready' && state.data.length === 0 && <EmptyState title="No institutions match that search" description="Try a different institution name or location." />}{state.status === 'ready' && state.data.length > 0 && <div className="institution-grid">{state.data.map((institution) => <InstitutionCard key={institution.slug} institution={institution} />)}</div>}</section>
    <section className="how-section" id="how-it-works"><div className="how-intro"><span className="eyebrow">A simpler campus rhythm</span><h2>Find it. Request it. Know what happens next.</h2></div><div className="how-grid"><div><span>01</span><h3>Pick your institution</h3><p>Start from a single directory, then move into the institution portal that matches your academic context.</p></div><div><span>02</span><h3>Browse live resources</h3><p>Search by category, capacity, and location once real inventory is connected to MongoDB Atlas.</p></div><div><span>03</span><h3>Track every request</h3><p>Users and admins each get a focused workspace with clear booking states.</p></div></div></section>
    <section className="trust-strip"><div><ShieldCheck size={22} /><strong>Role-aware by design</strong><span>Every workspace has a clear purpose.</span></div><div><Building2 size={22} /><strong>Shared academic access</strong><span>Reserve the spaces your work needs.</span></div><div><UsersRound size={22} /><strong>Built for shared use</strong><span>Users and Admins stay aligned.</span></div></section>
  </main></PublicShell>;
}

export function InstitutionPortalPage() {
  const { slug } = useParams();
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  useEffect(() => {
    let active = true;
    api.institution(slug).then((payload) => active && setState({ status: 'ready', data: payload.data, error: null })).catch((error) => active && setState({ status: 'error', data: null, error }));
    return () => { active = false; };
  }, [slug]);
  if (state.status === 'loading') return <PublicShell><main className="public-main narrow-main"><LoadingState label="Loading institution portal" /></main></PublicShell>;
  if (state.status === 'error') return <PublicShell><main className="public-main narrow-main"><ErrorState error={state.error} /></main></PublicShell>;
  const institution = state.data;
  return <PublicShell><main className="public-main narrow-main"><Link className="back-link" to="/">← Back to directory</Link><section className="portal-hero"><div className="portal-code">{institution.shortCode}</div><div><span className="eyebrow">Institution portal</span><h1>{institution.name}</h1><p>{institution.location}</p><p className="portal-description">{institution.description}</p></div></section><section className="portal-actions"><div><SectionLabel>Choose your route</SectionLabel><h2>What brings you here?</h2></div><div className="portal-action-grid"><Link to={`/login/user?institution=${institution.slug}`} className="portal-action"><span>User access</span><strong>Browse and request resources <ArrowRight size={16} /></strong></Link><Link to={`/login/admin?institution=${institution.slug}`} className="portal-action"><span>Admin access</span><strong>Review operations <ArrowRight size={16} /></strong></Link></div></section><section className="portal-resources"><PageHeader eyebrow="Resource preview" title="What this portal will hold" description="Live resource inventory connects here through MongoDB Atlas. The foundation shows the right empty and error states until records are configured." /><EmptyState title="Sign in to browse facilities" description="Resource inventory is private to authorized Users and Admins within this institution." /></section></main></PublicShell>;
}

export function RegistrationPage({ role }) {
    const navigate = useNavigate();
  const { acceptSessionUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', institutionSlug: '', role: 'user' });
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const [institutions, setInstitutions] = useState([]);
  useEffect(() => { api.institutions().then((payload) => setInstitutions(payload.data || [])).catch(() => setInstitutions([])); }, []);
  const submit = async (event) => {
    event.preventDefault(); setStatus({ state: 'loading', message: '' });
    try { const payload = await api.register(form); acceptSessionUser(payload.data); navigate('/user/dashboard'); } catch (error) { setStatus({ state: 'error', message: error.message }); }
  };
  return <PublicShell><main className="public-main narrow-main"><Link className="back-link" to="/">← Back to directory</Link><div className="auth-layout"><div className="auth-aside"><span className="eyebrow">User registration</span><h1>Make campus access feel less like paperwork.</h1><p>Create an institution-specific account to request rooms, labs, studios, and other academic resources.</p><div className="check-list"><span><CheckCircle2 size={17} /> Secure password login</span><span><CheckCircle2 size={17} /> Institution-aware access</span><span><CheckCircle2 size={17} /> Booking history in one place</span></div></div><form className="form-card" onSubmit={submit}><div className="form-heading"><span className="eyebrow">Create access</span><h2>Register as User</h2></div><label>Full name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" /></label><label>Academic email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@institution.edu" /></label><label>Password<input required minLength="8" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" /></label><label>Institution<select required value={form.institutionSlug} onChange={(event) => setForm({ ...form, institutionSlug: event.target.value })}><option value="">Select institution</option>{institutions.map((institution) => <option key={institution.slug} value={institution.slug}>{institution.name}</option>)}</select></label>{status.state === 'error' && <div className="inline-error">{status.message}</div>}<button className="button button-primary button-full" type="submit">Create account <ArrowRight size={17} /></button><p className="form-footnote">Already have access? <Link to={`/login/user`}>Sign in here</Link></p></form></div></main></PublicShell>;
}

export function AdminRegistrationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const portalInstitutionSlug = searchParams.get('institution') || '';
  const { acceptSessionUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', institutionSlug: portalInstitutionSlug, invitationCode: '' });
  const [institutions, setInstitutions] = useState([]);
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  useEffect(() => { api.institutions().then((payload) => setInstitutions(payload.data || [])).catch(() => setInstitutions([])); }, []);
  useEffect(() => { if (portalInstitutionSlug) setForm((current) => ({ ...current, institutionSlug: portalInstitutionSlug })); }, [portalInstitutionSlug]);
  const selectedInstitution = institutions.find((institution) => institution.slug === form.institutionSlug);
  const submit = async (event) => {
    event.preventDefault(); setStatus({ state: 'loading', message: '' });
    try { const payload = await api.registerAdmin(form); acceptSessionUser(payload.data); navigate('/admin/dashboard'); } catch (error) { setStatus({ state: 'error', message: error.message }); }
  };
  const institutionField = portalInstitutionSlug
    ? <div className="form-readonly"><span>Institution</span><strong>{selectedInstitution?.name || portalInstitutionSlug}</strong><small>Selected from the institution portal</small></div>
    : <label>Institution<select required value={form.institutionSlug} onChange={(event) => setForm({ ...form, institutionSlug: event.target.value })}><option value="">Select institution</option>{institutions.map((institution) => <option key={institution.slug} value={institution.slug}>{institution.name}</option>)}</select></label>;
  return <PublicShell><main className="public-main narrow-main"><Link className="back-link" to={portalInstitutionSlug ? `/login/admin?institution=${portalInstitutionSlug}` : '/login/admin'}>← Back to Admin sign in</Link><div className="auth-layout"><div className="auth-aside"><span className="eyebrow">Admin registration</span><h1>Set up your operations desk.</h1><p>Create an institution-scoped Admin account for the FSD college demonstration.</p><div className="check-list"><span><CheckCircle2 size={17} /> Invitation-code protected</span><span><CheckCircle2 size={17} /> Secure password login</span><span><CheckCircle2 size={17} /> Institution-isolated operations</span></div></div><form className="form-card" onSubmit={submit}><div className="form-heading"><span className="eyebrow">Create Admin access</span><h2>Register as Admin</h2></div><label>Full name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your full name" /></label><label>Academic email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="admin@institution.edu" /></label><label>Password<input required minLength="8" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" /></label>{institutionField}<label>Project invitation code<input required value={form.invitationCode} onChange={(event) => setForm({ ...form, invitationCode: event.target.value })} placeholder="Enter the project code" /></label>{status.state === 'error' && <div className="inline-error">{status.message}</div>}<button className="button button-primary button-full" type="submit">Create Admin account <ArrowRight size={17} /></button><p className="form-footnote">Already registered? <Link to={portalInstitutionSlug ? `/login/admin?institution=${portalInstitutionSlug}` : '/login/admin'}>Sign in here</Link></p></form></div></main></PublicShell>;
}

export function LoginPage({ role }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const portalInstitutionSlug = (searchParams.get('institution') || '').trim().toLowerCase();
  const { login } = useAuth();
  const label = role === 'admin' ? 'Admin' : 'User';
  const [form, setForm] = useState({ email: '', password: '', institutionSlug: portalInstitutionSlug });
  const [institutions, setInstitutions] = useState([]);
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => { api.institutions().then((payload) => setInstitutions(payload.data || [])).catch(() => setInstitutions([])); }, []);
  useEffect(() => { if (portalInstitutionSlug) setForm((current) => ({ ...current, institutionSlug: portalInstitutionSlug })); }, [portalInstitutionSlug]);
  const selectedInstitution = institutions.find((institution) => institution.slug === form.institutionSlug);
  const submit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true); setStatus({ state: 'loading', message: '' });
    try {
      await login({ email: form.email.trim().toLowerCase(), password: form.password, institutionSlug: form.institutionSlug.trim().toLowerCase(), role });
      navigate(role === 'admin' ? '/admin/dashboard' : '/user/dashboard', { replace: true });
    } catch (error) { setStatus({ state: 'error', message: error.message }); setIsSubmitting(false); }
  };
  return <PublicShell><main className="public-main narrow-main"><Link className="back-link" to="/">← Back to directory</Link><div className="auth-layout login-layout"><div className="auth-aside"><span className="eyebrow">{label} sign in</span><h1>Your work, in a clearer rhythm.</h1><p>Use the institution and role attached to your account. Your session is protected by the backend and stored in an HTTP-only cookie.</p><div className="login-stamp"><span>Workspace</span><strong>{role === 'admin' ? 'Operations desk' : `${label} access`}</strong></div></div><form className="form-card" onSubmit={submit}><div className="form-heading"><span className="eyebrow">Continue to workspace</span><h2>Welcome back</h2></div><label>Email address<input required disabled={isSubmitting} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@institution.edu" /></label><label>Password<input required disabled={isSubmitting} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Your password" /></label>{portalInstitutionSlug ? <div className="form-readonly"><span>Institution</span><strong>{selectedInstitution?.name || portalInstitutionSlug}</strong><small>Selected from the institution portal</small></div> : <label>Institution<select required disabled={isSubmitting} value={form.institutionSlug} onChange={(event) => setForm({ ...form, institutionSlug: event.target.value })}><option value="">Select institution</option>{institutions.map((institution) => <option key={institution.slug} value={institution.slug}>{institution.name}</option>)}</select></label>}{status.state === 'error' && <div className="inline-error">{status.message}</div>}<button className="button button-primary button-full" disabled={isSubmitting} type="submit">Open workspace <ArrowRight size={17} /></button><p className="form-footnote">{role === 'admin' ? <>Need an Admin account? <Link to={portalInstitutionSlug ? `/register/admin?institution=${portalInstitutionSlug}` : '/register/admin'}>Register with an invitation code</Link>.</> : 'Admin accounts are institution-scoped and invitation protected.'}</p></form></div></main></PublicShell>;
}

export function NotFoundPage() { return <PublicShell><main className="public-main narrow-main"><div className="not-found"><span className="eyebrow">404 · Route not found</span><h1>This path is not on the booking rail.</h1><p>Return to the institution directory and choose a supported workspace.</p><Link className="button button-primary" to="/">Back to directory <ArrowRight size={17} /></Link></div></main></PublicShell>; }
