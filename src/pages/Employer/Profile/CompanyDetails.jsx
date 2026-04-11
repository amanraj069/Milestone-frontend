import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';
import DashboardPage from '../../../components/DashboardPage';

const emptyForm = {
  companyName: '',
  companyPAN: '',
  billingAddress: '',
  accountsPayableEmail: '',
  taxIdentificationNumber: '',
  proofOfAddressUrl: '',
  officialBusinessEmail: '',
  companyLogoUrl: '',
};

const EmployerCompanyDetails = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000'}/api/employer/company-details`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch company details');
        }

        const result = await response.json();

        if (result?.isApproved) {
          navigate('/employer/profile', { replace: true });
          return;
        }

        if (result.success && result.data) {
          setFormData({
            companyName: result.data.companyName || '',
            companyPAN: result.data.companyPAN || '',
            billingAddress: result.data.billingAddress || '',
            accountsPayableEmail: result.data.accountsPayableEmail || '',
            taxIdentificationNumber: result.data.taxIdentificationNumber || '',
            proofOfAddressUrl: result.data.proofOfAddressUrl || '',
            officialBusinessEmail: result.data.officialBusinessEmail || '',
            companyLogoUrl: result.data.companyLogoUrl || '',
          });
        }
      } catch (error) {
        console.error('Error fetching company details:', error);
        alert('Failed to load company details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyDetails();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file for company logo.');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('companyLogo', file);

    try {
      setUploadingLogo(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000'}/api/employer/company-details/logo/upload`, {
        method: 'POST',
        credentials: 'include',
        body: uploadData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Logo upload failed');
      }

      setFormData((prev) => ({
        ...prev,
        companyLogoUrl: result.imageUrl,
      }));
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload company logo. Please try again.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleProofUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF for proof of address.');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('proofDocument', file);

    try {
      setUploadingProof(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000'}/api/employer/company-details/proof/upload`, {
        method: 'POST',
        credentials: 'include',
        body: uploadData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Proof upload failed');
      }

      setFormData((prev) => ({
        ...prev,
        proofOfAddressUrl: result.fileUrl,
      }));
    } catch (error) {
      console.error('Error uploading proof document:', error);
      alert('Failed to upload proof of address. Please try again.');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000'}/api/employer/company-details`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save company details');
      }

      localStorage.setItem('profileUpdated', 'true');
      window.dispatchEvent(new Event('storage'));
      alert('Company details saved successfully.');
      navigate('/employer/profile');
    } catch (error) {
      console.error('Error saving company details:', error);
      alert(error.message || 'Failed to save company details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardPage title="Company Details">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading company details...</p>
          </div>
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage title="Company Details">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-6 text-yellow-800 text-sm">
        These details cannot be changed later once the account is verified. Kindly fill the details carefully.
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company PAN *</label>
            <input
              type="text"
              name="companyPAN"
              value={formData.companyPAN}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter company PAN"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Accounts Payable Contact Email *</label>
            <input
              type="email"
              name="accountsPayableEmail"
              value={formData.accountsPayableEmail}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ap@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Official Business Email *</label>
            <input
              type="email"
              name="officialBusinessEmail"
              value={formData.officialBusinessEmail}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="official@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tax Identification Number (TIN / VAT / GST) *</label>
            <input
              type="text"
              name="taxIdentificationNumber"
              value={formData.taxIdentificationNumber}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter TIN / VAT / GST"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo Image *</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploadingLogo && <p className="text-xs text-blue-600 mt-1">Uploading logo...</p>}
            {formData.companyLogoUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={(formData.companyLogoUrl || '').startsWith('/') ? `${API_BASE_URL}${formData.companyLogoUrl}` : formData.companyLogoUrl}
                  alt="Company logo preview"
                  className="w-20 h-20 object-contain rounded border border-gray-200 bg-white"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <a
                  href={(formData.companyLogoUrl || '').startsWith('/') ? `${API_BASE_URL}${formData.companyLogoUrl}` : formData.companyLogoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Open full image
                </a>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Billing Address *</label>
          <textarea
            name="billingAddress"
            value={formData.billingAddress}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter complete billing address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Proof of Address (Utility bill / lease document - PDF) *</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleProofUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {uploadingProof && <p className="text-xs text-blue-600 mt-1">Uploading proof document...</p>}
          {formData.proofOfAddressUrl && (
            <a
              href={(formData.proofOfAddressUrl || '').startsWith('/') ? `${API_BASE_URL}${formData.proofOfAddressUrl}` : formData.proofOfAddressUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block"
            >
              View uploaded proof document
            </a>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/employer/profile')}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || uploadingLogo || uploadingProof}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Company Details'}
          </button>
        </div>
      </form>
    </DashboardPage>
  );
};

export default EmployerCompanyDetails;
