import React from 'react';
import { getBackendBaseUrl } from '../../utils/backendBaseUrl';

const ResumePreviewModal = ({ resumeUrl, onClose }) => {
  // Handle both local and Cloudinary URLs
  const getPreviewUrl = (url) => {
    if (!url) return '';
    
    // If it's a local path (starts with /uploads), prepend backend URL
    if (url.startsWith('/uploads')) {
      const backendUrl = getBackendBaseUrl();
      return `${backendUrl}${url}`;
    }
    
    // If it's a Cloudinary URL, return as-is
    if (url.includes('cloudinary.com')) {
      return url;
    }
    
    // For any other URL, return as-is
    return url;
  };

  const getDirectUrl = (url) => {
    if (!url) return '';
    
    // If it's a local path, prepend backend URL
    if (url.startsWith('/uploads')) {
      const backendUrl = getBackendBaseUrl();
      return `${backendUrl}${url}`;
    }
    
    // Return URL as-is for external URLs
    return url;
  };

  const isLocalPdf = resumeUrl && resumeUrl.startsWith('/uploads');
  const pdfUrl = getPreviewUrl(resumeUrl);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <p className='text-2xl font-serif'>Resume Preview</p> 
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body modal-body-resume">
          {isLocalPdf ? (
            <object
              data={pdfUrl}
              type="application/pdf"
              className="resume-preview-iframe"
            >
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Unable to display PDF in this browser.</p>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ display: 'inline-block', marginTop: '10px' }}
                >
                  <i className="fas fa-external-link-alt"></i> Open PDF in New Tab
                </a>
              </div>
            </object>
          ) : (
            <iframe
              src={pdfUrl}
              title="Resume Preview"
              className="resume-preview-iframe"
            />
          )}
        </div>
        <div className="modal-footer">
          <a
            href={getDirectUrl(resumeUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            <i className="fas fa-external-link-alt"></i> Open in New Tab
          </a>
          <button className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumePreviewModal;
