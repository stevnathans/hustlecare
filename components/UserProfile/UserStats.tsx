export default function UserStats({ businesses, totalCost }: { 
    businesses: number; 
    totalCost: string;
  }) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
        <div className="mt-4 flex space-x-6">
          <div className="bg-indigo-50 px-4 py-3 rounded-lg">
            <p className="text-sm text-indigo-700">Businesses</p>
            <p className="text-xl font-semibold text-indigo-900">{businesses}</p>
          </div>
          <div className="bg-indigo-50 px-4 py-3 rounded-lg">
            <p className="text-sm text-indigo-700">Total Estimated</p>
            <p className="text-xl font-semibold text-indigo-900">{totalCost}</p>
          </div>
        </div>
      </div>
    );
  }