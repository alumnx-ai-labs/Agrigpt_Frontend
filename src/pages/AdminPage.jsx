import React, { useState } from 'react';

const AdminPage = () => {
  const [selectedOption, setSelectedOption] = useState('Citrus Crop');
  const [showDropdown, setShowDropdown] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const options = ['Citrus Crop', 'Government Schemes'];

  // API base URL - uses environment variable for flexibility
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setShowDropdown(false);
    setUploadSuccess(false);
    setSelectedFile(null);
    setError(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
    } else if (file) {
      setError('Please select a valid PDF file');
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadSuccess(false);

    try {
      // Determine endpoint based on selected option
      let endpoint;
      if (selectedOption === 'Citrus Crop') {
        endpoint = `${API_URL}/upload-crop-data`;
      } else if (selectedOption === 'Government Schemes') {
        endpoint = `${API_URL}/upload-government-schemes`;
      }

      // Create FormData object
      const formData = new FormData();
      formData.append('file', selectedFile);

      console.log('Selected option:', selectedOption);
      console.log('Uploading to:', endpoint);
      console.log('File:', selectedFile.name);
      console.log('File type:', selectedFile.type);
      console.log('File size:', selectedFile.size);

      // Make API call to the appropriate endpoint
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);

      // Try to get response body regardless of status
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
      
      console.log('Response data:', responseData);

      if (!response.ok) {
        const errorMessage = typeof responseData === 'object' 
          ? (responseData?.detail || responseData?.message || JSON.stringify(responseData))
          : responseData;
        throw new Error(`Upload failed (${response.status}): ${errorMessage}`);
      }

      console.log('Upload successful');

      setUploadSuccess(true);
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getInstructionText = () => {
    if (selectedOption === 'Citrus Crop') {
      return 'Select the pdf file containing the Citrus Crop Data for Ingestion into the RAG database';
    } else {
      return 'Select the pdf file containing the Government Schemes Data for Ingestion into the RAG database';
    }
  };

  return (
    <div className="min-h-screen bg-[#e8e4e1] flex justify-center items-center p-8">
      <div className="bg-white p-12 max-w-6xl w-full shadow-md">
        <h1 className="text-center text-4xl mb-12 font-bold">
          AgriGPT SME AI Consultant
        </h1>

        {/* Dropdown Section */}
        <div className="flex items-center gap-8 mb-8">
          <label className="text-2xl font-semibold min-w-[200px]">
            Select an option
          </label>
          
          <div className="relative flex-1 max-w-md">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full px-6 py-3 bg-[#f0e6e6] border-none rounded text-xl font-semibold cursor-pointer flex justify-between items-center"
            >
              {selectedOption}
              <span className="text-2xl">▼</span>
            </button>

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded mt-1 shadow-md z-10">
                {options.map((option) => (
                  <div
                    key={option}
                    onClick={() => handleOptionSelect(option)}
                    className={`px-6 py-3 cursor-pointer text-xl font-semibold border-b border-gray-200 hover:bg-gray-100 ${
                      option === selectedOption ? 'bg-[#f0e6e6]' : 'bg-white'
                    }`}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-gray-100 p-10 mb-8 rounded">
          <p className="text-2xl font-semibold m-0 leading-relaxed">
            {getInstructionText()}
          </p>
        </div>

        {/* File Selection Display */}
        {selectedFile && (
          <div className="bg-gray-50 p-4 mb-4 rounded border border-gray-300">
            <p className="m-0 text-base text-gray-800">
              Selected file: <strong>{selectedFile.name}</strong>
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded mb-4">
            <p className="m-0 text-red-700 text-base">
              {error}
            </p>
          </div>
        )}

        {/* Upload Buttons */}
        <div className="flex justify-end gap-4 mb-8">
          <label className="bg-gray-500 text-white px-12 py-3.5 rounded-full text-xl font-semibold cursor-pointer inline-block hover:bg-gray-600 transition-colors">
            Choose File
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className={`px-12 py-3.5 rounded-full text-xl font-semibold border-none inline-block transition-colors ${
              !selectedFile || uploading
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-indigo-700 hover:bg-indigo-800 text-white cursor-pointer'
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>

        {/* Success Message */}
        {uploadSuccess && (
          <div className="bg-[#b2d8d8] p-8 rounded text-center">
            <p className="text-2xl font-semibold m-0">
              Thank you! The PDF file has been successfully ingested.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;