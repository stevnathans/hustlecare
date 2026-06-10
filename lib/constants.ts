export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Hustlecare'
export const APP_SLOGAN = process.env.NEXT_PUBLIC_APP_SLOGAN || 'Your business partner'
export const APP_DESCRIPTION = 
    process.env.NEXT_PUBLIC_APP_DESCRIPTION || 
    'Hustlecare helps you quickly identify requirements you need to start any business and calculate startup costs in record time'
export const PAGE_SIZE = Number(process.env.PAGE_SIZE || 9)   

export const PRICE_RANGES = [
  { label: 'All prices', min: 0, max: Infinity },
  { label: 'Under $50', min: 0, max: 50 },
  { label: '$50–$200', min: 50, max: 200 },
  { label: '$200–$1,000', min: 200, max: 1000 },
  { label: '$1,000+', min: 1000, max: Infinity },
];

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];