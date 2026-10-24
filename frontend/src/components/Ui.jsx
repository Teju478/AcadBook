import { ArrowUpRight, MapPin, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { institutionImages } from '../data/institutionImages.js';

const categoryLabels = { 'seminar-hall': 'Seminar hall', classroom: 'Classroom', laboratory: 'Laboratory', other: 'Other resource' };

export function BrandMark({ compact = false }) {
  return <Link to="/" className={`brand-mark ${compact ? 'brand-compact' : ''}`}><span className="campus-emblem" aria-hidden="true"><svg viewBox="0 0 36 36" role="presentation"><path className="emblem-book" d="M5 9.5c4.2-.7 8.2.2 13 3.3v15.3c-4.8-3.1-8.8-4-13-3.3V9.5Z" /><path className="emblem-book" d="M31 9.5c-4.2-.7-8.2.2-13 3.3v15.3c4.8-3.1 8.8-4-13-3.3V9.5Z" /><path className="emblem-spine" d="M18 12.8v15.3" /><circle className="emblem-pin" cx="18" cy="7.5" r="2.7" /></svg></span><span>AcadBook</span></Link>;
}

export function PageHeader({ eyebrow, title, description, action }) {
  return <div className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}

export function StatusPill({ status = 'pending' }) {
  return <span className={`status-pill status-${status}`}><span />{status}</span>;
}

export function StatCard({ label, value, note, tone = 'ink' }) {
  return <div className={`stat-card stat-${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

export function InstitutionCard({ institution }) {
  const image = institutionImages[institution.slug];
  return <Link className="institution-card" to={`/portal/${institution.slug}`}>
    {image && <div className="institution-image"><img src={image.src} alt={image.alt} loading="lazy" /></div>}
    <div className="card-index">{institution.shortCode}</div>
    <div className="card-content"><span className="eyebrow">Institution portal</span><h3>{institution.name}</h3><p><MapPin size={14} /> {institution.location}</p><span className="text-link">Open institution <ArrowUpRight size={15} /></span></div>
  </Link>;
}

export function ResourceCard({ resource, role = 'user' }) {
  return <Link className="resource-card" to={`/${role}/resources/${resource._id}`}>
    <div className="resource-topline"><span className="resource-category">{categoryLabels[resource.category] || resource.category || 'Academic space'}</span><span className={resource.isAvailable === false ? 'availability unavailable' : 'availability'}>{resource.isAvailable === false ? 'Unavailable' : 'Available'}</span></div>
    <h3>{resource.name}</h3><p>{resource.description}</p>
    <div className="resource-meta"><span><MapPin size={14} /> {resource.location}</span><span>Up to {resource.capacity}</span></div>
  </Link>;
}

export function SectionLabel({ children }) { return <span className="section-label"><Sparkles size={14} /> {children}</span>; }
