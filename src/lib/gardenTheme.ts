// Garden-themed UI utilities - Brand colors from Sow Plan

export const gardenColors = {
  // Brand sage greens
  sage: {
    DEFAULT: '#7D9A78',
    light: '#A8C4A2',
    dark: '#5C7A56',
    50: '#F4F7F3',
    100: '#E8EFE7',
    200: '#D1DFCE',
    300: '#A8C4A2',
    400: '#7D9A78',
    500: '#5C7A56',
  },
  // Brand terracotta
  terracotta: {
    DEFAULT: '#C4704B',
    light: '#E09070',
    dark: '#A85A3A',
    50: '#FDF6F3',
    100: '#FAEDE7',
    200: '#F5D8CC',
    300: '#E09070',
    400: '#C4704B',
    500: '#A85A3A',
  },
  // Brand mustard
  mustard: {
    DEFAULT: '#D4A84B',
    light: '#E8C878',
    dark: '#B8923A',
    50: '#FDFAF3',
    100: '#FAF4E5',
    200: '#F5E9CB',
    300: '#E8C878',
    400: '#D4A84B',
    500: '#B8923A',
  },
  // Brand earth tones
  earth: {
    DEFAULT: '#3D3229',
    deep: '#3D3229',
    warm: '#6B5B4F',
    50: '#F9F8F7',
    100: '#F2F0ED',
  },
  // Brand cream
  cream: {
    DEFAULT: '#FAF7F2',
    50: '#FFFEF9',
    100: '#FAF7F2',
    200: '#E8E4DE',
  },
};

// SVG pattern for subtle background
export const leafPattern = `data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%237D9A78' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E`;

export const plantPattern = `data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%237D9A78' fill-opacity='0.05' fill-rule='evenodd'%3E%3Ccircle cx='40' cy='40' r='3'/%3E%3Ccircle cx='10' cy='10' r='2'/%3E%3Ccircle cx='70' cy='70' r='2'/%3E%3Ccircle cx='10' cy='70' r='2'/%3E%3Ccircle cx='70' cy='10' r='2'/%3E%3C/g%3E%3C/svg%3E`;

export const gardenGradient = 'bg-gradient-to-br from-cream-100 via-sage-light/20 to-cream-50';
export const sunsetGradient = 'bg-gradient-to-br from-terracotta-light/20 via-mustard-light/20 to-cream-100';
export const skyGradient = 'bg-gradient-to-b from-sage-light/20 to-white';

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
