import React, { useState } from 'react';

const AdminPage = () => {
  const [selectedOption, setSelectedOption] = useState('Citrus Crop');
  const [showDropdown, setShowDropdown] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const options = ['Citrus Crop', 'Government Schemes'];

  // API base URL
  const API_URL = 'https://agrigpt-backend-rag.onrender.com';

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
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#e8e4e1',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '3rem',
        maxWidth: '1200px',
        width: '100%',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          textAlign: 'center',
          fontSize: '2.5rem',
          marginBottom: '3rem',
          fontWeight: 'bold'
        }}>
          AgriGPT SME AI Consultant
        </h1>

        {/* Dropdown Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          <label style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            minWidth: '200px'
          }}>
            Select an option
          </label>
          
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f0e6e6',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1.25rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              {selectedOption}
              <span style={{ fontSize: '1.5rem' }}>▼</span>
            </button>

            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginTop: '0.25rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 10
              }}>
                {options.map((option) => (
                  <div
                    key={option}
                    onClick={() => handleOptionSelect(option)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      cursor: 'pointer',
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      backgroundColor: option === selectedOption ? '#f0e6e6' : 'white',
                      borderBottom: '1px solid #eee'
                    }}
                    onMouseEnter={(e) => {
                      if (option !== selectedOption) {
                        e.target.style.backgroundColor = '#f5f5f5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (option !== selectedOption) {
                        e.target.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upload Section */}
        <div style={{
          backgroundColor: '#f0f0f0',
          padding: '2.5rem',
          marginBottom: '2rem',
          borderRadius: '4px'
        }}>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: 0,
            lineHeight: '1.6'
          }}>
            {getInstructionText()}
          </p>
        </div>

        {/* File Selection Display */}
        {selectedFile && (
          <div style={{
            backgroundColor: '#f9f9f9',
            padding: '1rem',
            marginBottom: '1rem',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}>
            <p style={{
              margin: 0,
              fontSize: '1rem',
              color: '#333'
            }}>
              Selected file: <strong>{selectedFile.name}</strong>
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            <p style={{
              margin: 0,
              color: '#c00',
              fontSize: '1rem'
            }}>
              {error}
            </p>
          </div>
        )}

        {/* Upload Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <label style={{
            backgroundColor: '#6b7280',
            color: 'white',
            padding: '0.875rem 3rem',
            borderRadius: '50px',
            fontSize: '1.25rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-block'
          }}>
            Choose File
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            style={{
              backgroundColor: !selectedFile || uploading ? '#9ca3af' : '#4c51bf',
              color: 'white',
              padding: '0.875rem 3rem',
              borderRadius: '50px',
              fontSize: '1.25rem',
              fontWeight: '600',
              cursor: !selectedFile || uploading ? 'not-allowed' : 'pointer',
              border: 'none',
              display: 'inline-block'
            }}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>

        {/* Success Message */}
        {uploadSuccess && (
          <div style={{
            backgroundColor: '#b2d8d8',
            padding: '2rem',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              margin: 0
            }}>
              Thank you! The PDF file has been successfully ingested.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;