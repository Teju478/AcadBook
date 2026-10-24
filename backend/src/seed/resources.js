import { Resource } from '../models/Resource.js';

const workstationUnits = (prefix, count) => Array.from({ length: count }, (_, index) => ({
  unitId: `${prefix}-${String(index + 1).padStart(2, '0')}`,
  label: `Workstation ${String(index + 1).padStart(2, '0')}`,
  kind: 'workstation',
  isAvailable: true
}));

export const DEMO_RESOURCES = [
  { institutionSlug: 'easwari-engineering-college', name: 'Innovation Seminar Hall', category: 'seminar-hall', description: 'Flexible presentation hall for department talks, reviews, and academic events.', capacity: 180, location: 'Main Block · Ground Floor', equipment: ['Projector', 'PA system', 'Stage lighting'], bookingMode: 'resource' },
  { institutionSlug: 'easwari-engineering-college', name: 'Embedded Systems Classroom', category: 'classroom', description: 'Tiered classroom for lectures, workshops, and internal assessments.', capacity: 72, location: 'Technology Block · Room T-204', equipment: ['Display panel', 'Whiteboard', 'Document camera'], bookingMode: 'resource' },
  { institutionSlug: 'easwari-engineering-college', name: 'Computer Applications Lab', category: 'laboratory', description: 'Configured lab for coding clinics, project work, and technical demonstrations.', capacity: 48, location: 'Technology Block · Lab T-112', equipment: ['Desktop workstations', 'Network access', 'Interactive display'], bookingMode: 'both', units: workstationUnits('EEC-CAL', 12) },
  { institutionSlug: 'easwari-engineering-college', name: 'Design Studio', category: 'other', description: 'Collaborative studio for prototyping, project reviews, and creative sessions.', capacity: 30, location: 'Innovation Wing · Studio I-03', equipment: ['Pin-up walls', 'Maker tables', 'Video display'], bookingMode: 'both', units: workstationUnits('EEC-DS', 8) },

  { institutionSlug: 'srm-medical-college', name: 'Clinical Seminar Hall', category: 'seminar-hall', description: 'Lecture hall for case discussions, medical seminars, and guest sessions.', capacity: 220, location: 'Academic Tower · Level 1', equipment: ['Dual projectors', 'Lecture capture', 'PA system'], bookingMode: 'resource' },
  { institutionSlug: 'srm-medical-college', name: 'Anatomy Teaching Classroom', category: 'classroom', description: 'Teaching classroom suited to small-group instruction and academic briefings.', capacity: 90, location: 'Medical Sciences Block · Room M-108', equipment: ['Display panel', 'Whiteboard', 'Lecture recording'], bookingMode: 'resource' },
  { institutionSlug: 'srm-medical-college', name: 'Health Informatics Lab', category: 'laboratory', description: 'Computer lab for health-data workshops, simulations, and research training.', capacity: 36, location: 'Research Block · Lab R-02', equipment: ['Desktop workstations', 'Secure network', 'Projection'], bookingMode: 'both', units: workstationUnits('SRM-HIL', 10) },
  { institutionSlug: 'srm-medical-college', name: 'Clinical Skills Studio', category: 'other', description: 'Flexible simulation studio for demonstrations, rehearsals, and team training.', capacity: 24, location: 'Clinical Education Centre · Studio C-01', equipment: ['Recording camera', 'Simulation tables', 'Portable display'], bookingMode: 'both', units: workstationUnits('SRM-CSS', 6) },

  { institutionSlug: 'srm-arts-and-science-college', name: 'Cultural Seminar Hall', category: 'seminar-hall', description: 'Event-ready hall for talks, screenings, student forums, and cultural programs.', capacity: 260, location: 'Arts Block · Ground Floor', equipment: ['Projector', 'Stage', 'PA system'], bookingMode: 'resource' },
  { institutionSlug: 'srm-arts-and-science-college', name: 'Media Studies Classroom', category: 'classroom', description: 'Bright classroom for lectures, critiques, and collaborative learning.', capacity: 60, location: 'Arts Block · Room A-306', equipment: ['Display panel', 'Whiteboard', 'Flexible seating'], bookingMode: 'resource' },
  { institutionSlug: 'srm-arts-and-science-college', name: 'Digital Media Lab', category: 'laboratory', description: 'Workstation lab for editing, digital production, and academic media projects.', capacity: 32, location: 'Media Wing · Lab D-04', equipment: ['Editing workstations', 'Headphones', 'High-speed network'], bookingMode: 'both', units: workstationUnits('SRM-DML', 10) },
  { institutionSlug: 'srm-arts-and-science-college', name: 'Performance Rehearsal Studio', category: 'other', description: 'Open studio for rehearsal, movement practice, and group production work.', capacity: 40, location: 'Cultural Centre · Studio P-02', equipment: ['Mirrors', 'Floor mats', 'Portable audio'], bookingMode: 'resource' },

  { institutionSlug: 'valliammai-engineering-college', name: 'Engineering Convention Hall', category: 'seminar-hall', description: 'Spacious hall for symposiums, reviews, department events, and invited talks.', capacity: 200, location: 'Central Block · Ground Floor', equipment: ['Projector', 'PA system', 'Stage lighting'], bookingMode: 'resource' },
  { institutionSlug: 'valliammai-engineering-college', name: 'Mechanical Design Classroom', category: 'classroom', description: 'Configurable classroom for engineering lectures and project presentations.', capacity: 84, location: 'Engineering Block · Room E-210', equipment: ['Display panel', 'Whiteboard', 'Document camera'], bookingMode: 'resource' },
  { institutionSlug: 'valliammai-engineering-college', name: 'Engineering Computing Lab', category: 'laboratory', description: 'Dedicated lab for CAD, programming, simulations, and project work.', capacity: 50, location: 'Engineering Block · Lab E-112', equipment: ['Desktop workstations', 'CAD software', 'Network access'], bookingMode: 'both', units: workstationUnits('VEC-ECL', 14) },
  { institutionSlug: 'valliammai-engineering-college', name: 'Project Collaboration Studio', category: 'other', description: 'Team studio for capstone reviews, prototyping, and student collaboration.', capacity: 28, location: 'Innovation Centre · Studio V-01', equipment: ['Maker tables', 'Pin-up walls', 'Display panel'], bookingMode: 'both', units: workstationUnits('VEC-PCS', 8) }
];

export async function seedDemoResources() {
  for (const resource of DEMO_RESOURCES) {
    await Resource.updateOne(
      { institutionSlug: resource.institutionSlug, name: resource.name },
      { $setOnInsert: resource },
      { upsert: true }
    );
  }
  console.log(`[seed] ensured ${DEMO_RESOURCES.length} demonstration resources`);
}
