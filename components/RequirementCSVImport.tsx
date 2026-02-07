/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useRef, useEffect } from "react";
import { Upload, X, Download } from "lucide-react";
import { toast } from "react-hot-toast";

type CSVRequirement = {
  name: string;
  description?: string;
  image?: string;
  category: string;
  businessId: number;
  necessity: 'Required' | 'Optional';
};

type Business = {
  id: number;
  name: string;
  published: boolean;
};

type RequirementCSVImportProps = {
  onImportComplete: () => void;
};

const CATEGORIES = ['Equipment', 'Software', 'Documents', 'Legal', 'Branding Resources', 'Operating Expenses'];

export default function RequirementCSVImport({ onImportComplete }: RequirementCSVImportProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requirements, setRequirements] = useState<CSVRequirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isModalOpen) {
      fetchPublishedBusinesses();
    }
  }, [isModalOpen]);

  const fetchPublishedBusinesses = async () => {
    try {
      const res = await fetch('/api/admin/businesses');
      if (res.ok) {
        const data = await res.json();
        // Filter only published businesses
        const published = data.filter((b: Business) => b.published);
        setBusinesses(published);
      }
    } catch (error) {
      console.error('Failed to fetch businesses:', error);
      toast.error('Failed to load businesses');
    }
  };

  const parseCSV = (text: string): CSVRequirement[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validate required headers
    const requiredHeaders = ['name', 'category', 'business', 'necessity'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    const requirements: CSVRequirement[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const requirement: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        if (header === 'name') {
          requirement[header] = value;
        } else if (header === 'description' || header === 'image') {
          requirement[header] = value || undefined;
        } else if (header === 'category') {
          // Validate category
          if (!CATEGORIES.includes(value)) {
            throw new Error(`Row ${i + 1}: Invalid category "${value}". Must be one of: ${CATEGORIES.join(', ')}`);
          }
          requirement[header] = value;
        } else if (header === 'business') {
          // Find business by name (case-insensitive)
          const business = businesses.find(
            b => b.name.toLowerCase() === value.toLowerCase()
          );
          if (!business) {
            throw new Error(`Row ${i + 1}: Business "${value}" not found or not published`);
          }
          requirement.businessId = business.id;
        } else if (header === 'necessity') {
          const normalizedValue = value.toLowerCase();
          if (normalizedValue === 'required' || normalizedValue === 'req') {
            requirement.necessity = 'Required';
          } else if (normalizedValue === 'optional' || normalizedValue === 'opt') {
            requirement.necessity = 'Optional';
          } else {
            throw new Error(`Row ${i + 1}: Invalid necessity "${value}". Must be "Required" or "Optional"`);
          }
        }
      });

      // Validate required fields
      if (!requirement.name) {
        throw new Error(`Row ${i + 1}: Missing required field: name`);
      }
      if (!requirement.category) {
        throw new Error(`Row ${i + 1}: Missing required field: category`);
      }
      if (!requirement.businessId) {
        throw new Error(`Row ${i + 1}: Missing required field: business`);
      }
      if (!requirement.necessity) {
        throw new Error(`Row ${i + 1}: Missing required field: necessity`);
      }

      requirements.push(requirement);
    }

    return requirements;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    if (businesses.length === 0) {
      toast.error('No published businesses available. Please publish at least one business first.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        setRequirements(parsed);
        toast.success(`${parsed.length} requirements loaded from CSV`);
      } catch (error: any) {
        console.error(error);
        toast.error(error.message || 'Failed to parse CSV');
        setRequirements([]);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (requirements.length === 0) {
      toast.error('No requirements to import');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const requirement of requirements) {
        try {
          const res = await fetch('/api/requirements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requirement),
          });

          if (res.ok) {
            successCount++;
          } else {
            failCount++;
            console.error(`Failed to import ${requirement.name}`);
          }
        } catch (error) {
          failCount++;
          console.error(`Error importing ${requirement.name}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} requirements!`);
        onImportComplete();
        closeModal();
      }
      
      if (failCount > 0) {
        toast.error(`Failed to import ${failCount} requirements`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Import failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const exampleBusiness = businesses.length > 0 ? businesses[0].name : 'Example Business';
    
    const template = `name,category,business,necessity,description,image
Point of Sale System,Equipment,${exampleBusiness},Required,Modern POS system with inventory tracking,https://example.com/pos.jpg
Accounting Software,Software,${exampleBusiness},Required,Cloud-based accounting solution,
Business License,Legal,${exampleBusiness},Required,State business operating license,
Logo Design,Branding Resources,${exampleBusiness},Optional,Professional logo package,`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'requirement-template.csv';
    a.click();
    toast.success('Template downloaded!');
  };

  const openModal = () => {
    setRequirements([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setRequirements([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const getBusinessName = (businessId: number) => {
    return businesses.find(b => b.id === businessId)?.name || 'Unknown';
  };

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center justify-center px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm hover:shadow-md font-medium"
      >
        <Upload className="h-5 w-5 mr-2" />
        Import CSV
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={closeModal}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl p-6 w-full max-w-4xl shadow-xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Import Requirements from CSV
              </h2>

              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>CSV Format:</strong> Your file must include these columns:
                </p>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                  <li><strong>name</strong> (required) - Requirement name</li>
                  <li><strong>category</strong> (required) - One of: {CATEGORIES.join(', ')}</li>
                  <li><strong>business</strong> (required) - Business name (must match a published business exactly)</li>
                  <li><strong>necessity</strong> (required) - &quot;Required&quot; or &quot;Optional&quot;</li>
                  <li><strong>description</strong> (optional) - Requirement description</li>
                  <li><strong>image</strong> (optional) - Image URL</li>
                </ul>
                {businesses.length === 0 && (
                  <p className="text-sm text-red-600 mt-2 font-semibold">
                    ⚠️ No published businesses found. Please publish at least one business before importing requirements.
                  </p>
                )}
                {businesses.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-blue-800 font-semibold mb-1">Available Published Businesses:</p>
                    <p className="text-sm text-blue-700">{businesses.map(b => b.name).join(', ')}</p>
                  </div>
                )}
                <button
                  onClick={downloadTemplate}
                  disabled={businesses.length === 0}
                  className="mt-3 flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={businesses.length === 0}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {requirements.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Preview ({requirements.length} requirements)
                  </h3>
                  <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Category</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Business</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Necessity</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {requirements.map((requirement, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-900">{requirement.name}</td>
                            <td className="px-3 py-2">
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-800">
                                {requirement.category}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-600">{getBusinessName(requirement.businessId)}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                                requirement.necessity === 'Required'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {requirement.necessity}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => removeRequirement(index)}
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
                  disabled={loading || requirements.length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Importing...' : `Import ${requirements.length} Requirements`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}