// Garden-themed UI utilities

export const gardenColors = {
  leaf: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  soil: {
    50: '#faf9f7',
    100: '#f5f1eb',
    200: '#e8dfd1',
    300: '#d4c4ab',
    400: '#b39b7a',
    500: '#8b7355',
    600: '#6b5740',
    700: '#4a3d2d',
    800: '#3a3024',
    900: '#2d241c',
  },
  flower: {
    pink: '#f472b6',
    purple: '#c084fc',
    yellow: '#fbbf24',
    orange: '#fb923c',
    red: '#f87171',
  },
  sky: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
  },
};

// SVG pattern for subtle background
export const leafPattern = `data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E`;

export const plantPattern = `data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2322c55e' fill-opacity='0.05' fill-rule='evenodd'%3E%3Ccircle cx='40' cy='40' r='3'/%3E%3Ccircle cx='10' cy='10' r='2'/%3E%3Ccircle cx='70' cy='70' r='2'/%3E%3Ccircle cx='10' cy='70' r='2'/%3E%3Ccircle cx='70' cy='10' r='2'/%3E%3C/g%3E%3C/svg%3E`;

export const gardenGradient = 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50';
export const sunsetGradient = 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50';
export const skyGradient = 'bg-gradient-to-b from-sky-100 to-white';

// Plant-themed decorative SVG components as strings
export const plantIconSVG = (className = "w-6 h-6") => `
  <svg class="${className}" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C10.3431 2 9 3.34315 9 5C9 5.82843 9.33579 6.58579 9.87868 7.12132C9.33579 7.65685 9 8.41421 9 9.25C9 10.9069 10.3431 12.25 12 12.25C13.6569 12.25 15 10.9069 15 9.25C15 8.41421 14.6642 7.65685 14.1213 7.12132C14.6642 6.58579 15 5.82843 15 5C15 3.34315 13.6569 2 12 2Z"/>
    <path d="M12 12.25V22"/>
    <path d="M12 15C10.3431 15 9 16.3431 9 18H15C15 16.3431 13.6569 15 12 15Z"/>
  </svg>
`;

export const seedlingIconSVG = (className = "w-6 h-6") => `
  <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 22V11"/>
    <path d="M12 11C12 8.79086 10.2091 7 8 7C5.79086 7 4 8.79086 4 11"/>
    <path d="M12 11C12 8.79086 13.7909 7 16 7C18.2091 7 20 8.79086 20 11"/>
  </svg>
`;
