/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useRef } from "react";
import { Upload, X, Download } from "lucide-react";
import { toast } from "react-hot-toast";

type CSVBusiness = {
  name: string;
  description?: string;
  image?: string;
  slug: string;
  published: boolean;
  categoryName?: string;
};

type BusinessCSVImportProps = {
  onImportComplete: () => void;
};

export default function BusinessCSVImport({ onImportComplete }: BusinessCSVImportProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [businesses, setBusinesses] = useState<CSVBusiness[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const parseCSV = (text: string): CSVBusiness[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    const requiredHeaders = ['name'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required column: name`);
    }

    const businesses: CSVBusiness[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Handle quoted values that may contain commas
      const values = parseCSVLine(lines[i]);
      const business: any = {};

      headers.forEach((header, index) => {
        const value = values[index]?.trim() || '';

        if (header === 'name') {
          business.name = value;
        } else if (header === 'slug') {
          business.slug = value || undefined;
        } else if (header === 'description' || header === 'image') {
          business[header] = value || undefined;
        } else if (header === 'published') {
          business.published = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes' || value === '1';
        } else if (header === 'category') {
          business.categoryName = value || undefined;
        }
      });

      if (!business.hasOwnProperty('published')) {
        business.published = true;
      }

      if (!business.slug && business.name) {
        business.slug = generateSlug(business.name);
      }

      if (!business.name) {
        throw new Error(`Row ${i + 1}: Missing required field: name`);
      }

      businesses.push(business);
    }

    return businesses;
  };

  // Simple CSV line parser that handles double-quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        setBusinesses(parsed);
        toast.success(`${parsed.length} businesses loaded from CSV`);
      } catch (error: any) {
        console.error(error);
        toast.error(error.message || 'Failed to parse CSV');
        setBusinesses([]);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (businesses.length === 0) {
      toast.error('No businesses to import');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const business of businesses) {
        try {
          const res = await fetch('/api/admin/businesses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(business), // categoryName is included here automatically
          });

          if (res.ok) {
            successCount++;
          } else {
            failCount++;
            const data = await res.json().catch(() => ({}));
            console.error(`Failed to import ${business.name}:`, data.error);
          }
        } catch (error) {
          failCount++;
          console.error(`Error importing ${business.name}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} businesses!`);
        onImportComplete();
        closeModal();
      }

      if (failCount > 0) {
        toast.error(`Failed to import ${failCount} businesses`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Import failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      'name,description,image,published,category',
      'Example Business,This is a description,https://example.com/image.jpg,true,Retail',
      'Another Business,Another description,,false,Technology',
      'Third Business,No image or category,,,',
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'business-template.csv';
    a.click();
    toast.success('Template downloaded!');
  };

  const openModal = () => {
    setBusinesses([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setBusinesses([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeBusiness = (index: number) => {
    setBusinesses(businesses.filter((_, i) => i !== index));
  };

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        <Upload className="h-4 w-4" />
        Import CSV
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeModal} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl p-6 w-full max-w-3xl shadow-xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Import Businesses from CSV
              </h2>

              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>CSV Format:</strong> Your file must include these columns:
                </p>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                  <li><strong>name</strong> (required) — Business name</li>
                  <li><strong>description</strong> (optional) — Business description</li>
                  <li><strong>image</strong> (optional) — Image URL</li>
                  <li><strong>published</strong> (optional) — true/false or yes/no (default: true)</li>
                  <li><strong>slug</strong> (optional) — Custom URL slug (auto-generated if omitted)</li>
                  <li>
                    <strong>category</strong> (optional) — Category name; existing categories are matched
                    by name, new ones are created automatically
                  </li>
                </ul>
                <button
                  onClick={downloadTemplate}
                  className="mt-3 flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 font-medium"
                >
                  <Download className="h-4 w-4" />
                  Download Template CSV
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {businesses.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Preview ({businesses.length} businesses)
                  </h3>
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Slug</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Category</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {businesses.map((business, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-900">{business.name}</td>
                            <td className="px-3 py-2 text-gray-600">{business.slug}</td>
                            <td className="px-3 py-2">
                              {business.categoryName ? (
                                <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">
                                  {business.categoryName}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                                business.published
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {business.published ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => removeBusiness(index)}
                                className="text-red-600 hover:text-red-800"
                                title="Remove"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={loading || businesses.length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Importing...' : `Import ${businesses.length} Businesses`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}