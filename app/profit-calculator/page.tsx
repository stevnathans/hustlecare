'use client';
import { useState, useEffect } from 'react';

type InputValues = {
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  taxes: number;
  interest: number;
};

type CalculationResults = {
  grossProfit: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
};

type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'KES';

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  KES: 'Ksh',
};

const fieldDescriptions = {
  revenue: "Total income from sales before any expenses are deducted",
  cogs: "Direct costs of producing goods sold (materials, labor, etc.)",
  operatingExpenses: "Ongoing costs to run the business (rent, salaries, utilities)",
  taxes: "Taxes paid on business profits",
  interest: "Interest payments on loans or credit"
};

export default function ProfitCalculator() {
  const [inputs, setInputs] = useState<InputValues>({
    revenue: 0,
    cogs: 0,
    operatingExpenses: 0,
    taxes: 0,
    interest: 0,
  });

  const [results, setResults] = useState<CalculationResults>({
    grossProfit: 0,
    netProfit: 0,
    grossMargin: 0,
    netMargin: 0,
  });

  const [currency, setCurrency] = useState<Currency>('USD');

  useEffect(() => {
    const { revenue, cogs, operatingExpenses, taxes, interest } = inputs;

    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - operatingExpenses - taxes - interest;

    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    setResults({
      grossProfit,
      netProfit,
      grossMargin,
      netMargin,
    });
  }, [inputs]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs({
      ...inputs,
      [name]: parseFloat(value) || 0,
    });
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">
        Profit Margin Calculator
      </h1>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Currency
        </label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="USD">US Dollar ($)</option>
          <option value="EUR">Euro (€)</option>
          <option value="GBP">British Pound (£)</option>
          <option value="JPY">Japanese Yen (¥)</option>
          <option value="KES">Kenyan Shilling (Ksh)</option>
        </select>
      </div>

      <div className="space-y-4 mb-6">
        {[
          { label: 'Revenue', name: 'revenue' },
          { label: 'Cost of Goods Sold', name: 'cogs' },
          { label: 'Operating Expenses', name: 'operatingExpenses' },
          { label: 'Taxes', name: 'taxes' },
          { label: 'Interest', name: 'interest' },
        ].map((field) => (
          <div key={field.name} className="relative">
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700">
                {field.label} ({currencySymbols[currency]})
              </label>
              <div className="group relative ml-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="hidden group-hover:block absolute z-10 w-64 p-2 mt-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-lg">
                  {fieldDescriptions[field.name as keyof typeof fieldDescriptions]}
                </div>
              </div>
            </div>
            <input
              type="number"
              name={field.name}
              value={inputs[field.name as keyof InputValues]}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              min="0"
              step="0.01"
            />
          </div>
        ))}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Results</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded shadow">
            <div className="flex items-center">
              <p className="text-sm text-gray-600">Gross Profit</p>
              <div className="group relative ml-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="hidden group-hover:block absolute z-10 w-64 p-2 mt-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-lg">
                  Revenue minus direct production costs (COGS)
                </div>
              </div>
            </div>
            <p className="font-bold">
              {currencySymbols[currency]}{results.grossProfit.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              Margin: {results.grossMargin.toFixed(2)}%
            </p>
          </div>
          <div className="bg-white p-3 rounded shadow">
            <div className="flex items-center">
              <p className="text-sm text-gray-600">Net Profit</p>
              <div className="group relative ml-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="hidden group-hover:block absolute z-10 w-64 p-2 mt-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-lg">
                  Final profit after all expenses (COGS, operating costs, taxes, interest)
                </div>
              </div>
            </div>
            <p className="font-bold">
              {currencySymbols[currency]}{results.netProfit.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              Margin: {results.netMargin.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}