import { useState, useEffect } from 'react';
import { FiMapPin, FiLoader } from 'react-icons/fi';

interface BusinessHeaderProps {
  businessType: string;
  initialLocation?: string;
  costRange?: [number, number];
  onLocationChange?: (location: string) => void;
  loading?: boolean;
}

export default function BusinessHeader({
  businessType,
  initialLocation = 'Austin, TX',
  costRange,
  onLocationChange,
  loading = false
}: BusinessHeaderProps) {
  const [location, setLocation] = useState(initialLocation);
  const [isSticky, setIsSticky] = useState(false);
  const locations = [
    { value: 'Austin, TX', multiplier: 1.0 },
    { value: 'New York, NY', multiplier: 1.4 },
    { value: 'San Francisco, CA', multiplier: 1.3 },
    { value: 'Chicago, IL', multiplier: 1.1 }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
    onLocationChange?.(newLocation);
  };

  const locationMultiplier = locations.find(loc => loc.value === location)?.multiplier || 1.0;
  const adjustedCostRange = costRange?.map(cost => Math.round(cost * locationMultiplier)) as [number, number];

  return (
    <header className={`bg-white shadow-sm transition-all duration-300 z-20 ${
      isSticky ? 'sticky top-0 py-3 shadow-md' : 'py-6'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className={`font-bold text-gray-900 truncate ${
              isSticky ? 'text-xl' : 'text-2xl md:text-3xl'
            }`}>
              Starting a {businessType}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <FiMapPin className="text-gray-500" />
              <select
                value={location}
                onChange={handleLocationChange}
                className="border-0 bg-transparent p-1 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {locations.map((loc) => (
                  <option key={loc.value} value={loc.value}>
                    {loc.value}
                  </option>
                ))}
              </select>
              {locationMultiplier !== 1.0 && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                  {locationMultiplier}x pricing
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-3 rounded-lg">
              <FiLoader className="animate-spin text-blue-500" />
              <span className="text-sm text-blue-700">Calculating costs...</span>
            </div>
          ) : costRange ? (
            <div className="bg-blue-50 px-4 py-3 rounded-lg min-w-[200px]">
              <p className="text-sm font-medium text-gray-600">Estimated Cost</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-blue-700">
                  ${adjustedCostRange[0].toLocaleString()} - ${adjustedCostRange[1].toLocaleString()}
                </p>
                {locationMultiplier !== 1.0 && (
                  <span className="text-xs text-blue-500">*</span>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}