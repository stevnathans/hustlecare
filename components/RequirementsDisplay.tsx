'use client';

export const RequirementsDisplay = ({ requirements }: { requirements: { [key: string]: string[] } }) => {
  return (
    <div className="mt-8">
      {Object.keys(requirements).map((category) => (
        <div key={category} className="mb-6">
          <h2 className="text-2xl font-bold text-blue-800 mb-2">{category}</h2>
          <ul className="list-disc list-inside space-y-1">
            {requirements[category].map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
