'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type AddMode = 'select' | 'contact' | 'organization' | 'csv';

export default function AddContactPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AddMode>('select');

  const handleBack = () => {
    if (mode === 'select') {
      router.back();
    } else {
      setMode('select');
    }
  };

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="border-b border-stone-200 px-6 py-4">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={handleBack}
              className="text-stone-500 hover:text-stone-700 transition-colors"
              aria-label="Go back"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-semibold text-stone-900">Add New Contact</h1>
          </div>
          <p className="text-sm text-stone-500 ml-10">Choose how you&apos;d like to add contacts to your network</p>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Single Contact */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-stone-900 mb-4">Add Individual Contact</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Card */}
                <button
                  onClick={() => setMode('contact')}
                  className="p-6 border border-stone-200 rounded-lg hover:border-stone-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-stone-900 mb-1">Add Person</h3>
                      <p className="text-sm text-stone-500">Add a single contact person with their details</p>
                    </div>
                    <svg className="w-5 h-5 text-stone-300 group-hover:text-stone-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                {/* Organization Card */}
                <button
                  onClick={() => setMode('organization')}
                  className="p-6 border border-stone-200 rounded-lg hover:border-stone-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-stone-900 mb-1">Add Organization</h3>
                      <p className="text-sm text-stone-500">Create an organization profile for management</p>
                    </div>
                    <svg className="w-5 h-5 text-stone-300 group-hover:text-stone-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-stone-200" />
              <span className="text-sm text-stone-500">or</span>
              <div className="flex-1 h-px bg-stone-200" />
            </div>

            {/* Bulk Import */}
            <div>
              <h2 className="text-lg font-semibold text-stone-900 mb-4">Bulk Import</h2>
              <button
                onClick={() => setMode('csv')}
                className="w-full p-6 border border-stone-200 rounded-lg hover:border-stone-300 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-stone-900 mb-1">Import CSV</h3>
                    <p className="text-sm text-stone-500">Upload a CSV file to add multiple contacts or organizations at once</p>
                  </div>
                  <svg className="w-5 h-5 text-stone-300 group-hover:text-stone-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Contact Form
  if (mode === 'contact') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="border-b border-stone-200 px-6 py-4">
          <button
            onClick={handleBack}
            className="text-stone-500 hover:text-stone-700 transition-colors mb-2"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-semibold text-stone-900">Add Person</h1>
          <p className="text-sm text-stone-500 mt-1">Step 1 of 3: Basic Information</p>
        </div>
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <p className="text-stone-600">Contact form coming soon...</p>
          </div>
        </div>
      </div>
    );
  }

  // Organization Form
  if (mode === 'organization') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="border-b border-stone-200 px-6 py-4">
          <button
            onClick={handleBack}
            className="text-stone-500 hover:text-stone-700 transition-colors mb-2"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-semibold text-stone-900">Add Organization</h1>
          <p className="text-sm text-stone-500 mt-1">Step 1 of 3: Basic Information</p>
        </div>
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <p className="text-stone-600">Organization form coming soon...</p>
          </div>
        </div>
      </div>
    );
  }

  // CSV Import
  if (mode === 'csv') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="border-b border-stone-200 px-6 py-4">
          <button
            onClick={handleBack}
            className="text-stone-500 hover:text-stone-700 transition-colors mb-2"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-semibold text-stone-900">Import Contacts</h1>
          <p className="text-sm text-stone-500 mt-1">Step 1 of 4: Upload CSV File</p>
        </div>
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <div className="border-2 border-dashed border-stone-200 rounded-lg p-12 text-center hover:border-stone-300 transition-colors cursor-pointer">
              <svg className="w-12 h-12 text-stone-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-stone-900 font-medium mb-1">Drop your CSV file here</p>
              <p className="text-sm text-stone-500">or click to browse</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
