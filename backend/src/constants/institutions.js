export const PREDEFINED_INSTITUTIONS = [
  {
    name: 'Easwari Engineering College',
    slug: 'easwari-engineering-college',
    location: 'Ramapuram, Chennai',
    shortCode: 'EEC',
    description: 'Engineering learning spaces, studios, and academic facilities in Ramapuram.'
  },
  {
    name: 'SRM Medical College Hospital and Research Centre',
    slug: 'srm-medical-college',
    location: 'Kattankulathur, Tamil Nadu',
    shortCode: 'SMC',
    description: 'Clinical, simulation, and research resources connected to a teaching hospital.'
  },
  {
    name: 'SRM Arts and Science College',
    slug: 'srm-arts-and-science-college',
    location: 'Kattankulathur, Chennai',
    shortCode: 'SASC',
    description: 'Flexible learning rooms and creative resources for arts and science cohorts.'
  },
  {
    name: 'Valliammai Engineering College',
    slug: 'valliammai-engineering-college',
    location: 'Kattankulathur, Chennai',
    shortCode: 'VEC',
    description: 'Practical engineering labs and shared academic infrastructure.'
  }
];

export const institutionBySlug = (slug) => PREDEFINED_INSTITUTIONS.find((item) => item.slug === slug);
