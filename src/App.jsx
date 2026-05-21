import React, { useState, useEffect } from 'react';
import './App.css';

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

function App() {
  const [step, setStep] = useState(1);
  const [scriptUrl, setScriptUrl] = useState(() => {
    return import.meta.env.VITE_GOOGLE_SCRIPT_URL || localStorage.getItem('kyc_script_url') || '/api/kyc';
  });
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    // Permanent Address
    permStreet: '',
    permVillage: '',
    permPostOffice: '',
    permCity: '',
    permBlock: '',
    permDistrict: '',
    permState: '',
    // Current Address
    currStreet: '',
    currVillage: '',
    currPostOffice: '',
    currCity: '',
    currBlock: '',
    currDistrict: '',
    currState: '',
    isSameAddress: false,
    // Mandatory Aadhar Card
    aadharNumber: '',
    aadharPhotoBase64: '',
    aadharPhotoName: '',
    aadharPhotoType: '',
    aadharPhotoSize: '',
    // Optional Secondary Document
    otherDocType: 'PAN Card',
    otherDocNumber: '',
    otherDocPhotoBase64: '',
    otherDocPhotoName: '',
    otherDocPhotoType: '',
    otherDocPhotoSize: '',
    // Signature
    signatureBase64: '',
    signatureName: '',
    signatureType: '',
    signatureSize: '',
    // Bank Details
    bankHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    // Emergency Details
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  // Save Apps Script Web App URL to localStorage
  useEffect(() => {
    localStorage.setItem('kyc_script_url', scriptUrl);
  }, [scriptUrl]);

  // Handle same address toggle
  useEffect(() => {
    if (formData.isSameAddress) {
      setFormData(prev => ({
        ...prev,
        currStreet: prev.permStreet,
        currVillage: prev.permVillage,
        currPostOffice: prev.permPostOffice,
        currCity: prev.permCity,
        currBlock: prev.permBlock,
        currDistrict: prev.permDistrict,
        currState: prev.permState
      }));
    }
  }, [
    formData.isSameAddress, 
    formData.permStreet,
    formData.permVillage,
    formData.permPostOffice,
    formData.permCity,
    formData.permBlock,
    formData.permDistrict,
    formData.permState
  ]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear validation error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Convert File to Base64
  const handleFileChange = (e, fieldPrefix) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [fieldPrefix]: 'File size must be under 2.5 MB'
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        [`${fieldPrefix}Base64`]: reader.result,
        [`${fieldPrefix}Name`]: file.name,
        [`${fieldPrefix}Type`]: file.type,
        [`${fieldPrefix}Size`]: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      }));
      setErrors(prev => ({ ...prev, [fieldPrefix]: '' }));
    };
    reader.onerror = () => {
      setErrors(prev => ({
        ...prev,
        [fieldPrefix]: 'Failed to read file.'
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (fieldPrefix) => {
    setFormData(prev => ({
      ...prev,
      [`${fieldPrefix}Base64`]: '',
      [`${fieldPrefix}Name`]: '',
      [`${fieldPrefix}Type`]: '',
      [`${fieldPrefix}Size`]: ''
    }));
  };

  // Step Validations
  const validateStep = () => {
    const tempErrors = {};
    
    if (step === 1) {
      if (!formData.fullName.trim()) tempErrors.fullName = 'Full Name is required';
      else if (formData.fullName.trim().length < 3) tempErrors.fullName = 'Name must be at least 3 characters';
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim()) tempErrors.email = 'Email is required';
      else if (!emailRegex.test(formData.email)) tempErrors.email = 'Enter a valid email address';
      
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!formData.phone.trim()) tempErrors.phone = 'Phone number is required';
      else if (!phoneRegex.test(formData.phone)) tempErrors.phone = 'Enter a valid 10-digit mobile number';
      
      if (!formData.dob) tempErrors.dob = 'Date of birth is required';
      if (!formData.gender) tempErrors.gender = 'Gender is required';
    } 
    
    else if (step === 2) {
      // Permanent Address
      if (!formData.permStreet.trim()) tempErrors.permStreet = 'Street Address is required';
      if (!formData.permVillage.trim()) tempErrors.permVillage = 'Village is required';
      if (!formData.permPostOffice.trim()) tempErrors.permPostOffice = 'Post Office is required';
      if (!formData.permCity.trim()) tempErrors.permCity = 'City is required';
      if (!formData.permBlock.trim()) tempErrors.permBlock = 'Block/Tehsil is required';
      if (!formData.permDistrict.trim()) tempErrors.permDistrict = 'District is required';
      if (!formData.permState.trim()) tempErrors.permState = 'State is required';
      
      // Current Address
      if (!formData.isSameAddress) {
        if (!formData.currStreet.trim()) tempErrors.currStreet = 'Street Address is required';
        if (!formData.currVillage.trim()) tempErrors.currVillage = 'Village is required';
        if (!formData.currPostOffice.trim()) tempErrors.currPostOffice = 'Post Office is required';
        if (!formData.currCity.trim()) tempErrors.currCity = 'City is required';
        if (!formData.currBlock.trim()) tempErrors.currBlock = 'Block/Tehsil is required';
        if (!formData.currDistrict.trim()) tempErrors.currDistrict = 'District is required';
        if (!formData.currState.trim()) tempErrors.currState = 'State is required';
      }
    } 
    
    else if (step === 3) {
      // Validate Aadhar Number (Mandatory: 12 digits)
      const aadharClean = formData.aadharNumber.replace(/\s/g, '');
      if (!formData.aadharNumber.trim()) {
        tempErrors.aadharNumber = 'Aadhar Number is required';
      } else if (!/^\d{12}$/.test(aadharClean)) {
        tempErrors.aadharNumber = 'Aadhar Card number must be 12 digits';
      }

      // Validate Aadhar File Upload (Mandatory)
      if (!formData.aadharPhotoBase64) {
        tempErrors.aadharPhoto = 'Aadhar Card file upload is required';
      }

      // Validate Optional Secondary Document only if filled
      if (formData.otherDocNumber.trim() || formData.otherDocPhotoBase64) {
        if (!formData.otherDocNumber.trim()) {
          tempErrors.otherDocNumber = 'Please enter the document number';
        } else if (formData.otherDocType === 'PAN Card') {
          const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
          if (!panRegex.test(formData.otherDocNumber.toUpperCase())) {
            tempErrors.otherDocNumber = 'Invalid PAN Card Format (e.g. ABCDE1234F)';
          }
        }
        
        if (!formData.otherDocPhotoBase64) {
          tempErrors.otherDocPhoto = 'Please upload the document copy';
        }
      }

      // Signature copy (Mandatory)
      if (!formData.signatureBase64) {
        tempErrors.signature = 'Signature verification photo is required';
      }
    } 
    
    else if (step === 4) {
      if (!formData.bankHolderName.trim()) tempErrors.bankHolderName = 'Account holder name is required';
      if (!formData.bankName.trim()) tempErrors.bankName = 'Bank name is required';
      if (!formData.accountNumber.trim()) tempErrors.accountNumber = 'Account number is required';
      else if (!/^\d{9,18}$/.test(formData.accountNumber)) tempErrors.accountNumber = 'Invalid account number (9 to 18 digits)';
      
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!formData.ifscCode.trim()) tempErrors.ifscCode = 'IFSC Code is required';
      else if (!ifscRegex.test(formData.ifscCode.toUpperCase())) {
        tempErrors.ifscCode = 'Invalid IFSC Format (e.g. SBIN0001234)';
      }
      
      if (!formData.emergencyName.trim()) tempErrors.emergencyName = 'Contact name is required';
      if (!formData.emergencyRelation.trim()) tempErrors.emergencyRelation = 'Relationship is required';
      
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!formData.emergencyPhone.trim()) tempErrors.emergencyPhone = 'Emergency phone is required';
      else if (!phoneRegex.test(formData.emergencyPhone)) tempErrors.emergencyPhone = 'Enter a valid 10-digit number';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  // Submit Data to Google Sheets API (Apps Script)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scriptUrl) {
      alert("Please configure the Google Apps Script Web App URL (VITE_GOOGLE_SCRIPT_URL) in your .env file.");
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    // Clean payload: if optional secondary doc is not provided, clear its type
    const payload = { ...formData };
    if (!payload.otherDocNumber.trim() && !payload.otherDocPhotoBase64) {
      payload.otherDocType = '';
    }

    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      setSubmitResult({
        status: 'success',
        message: 'Your KYC application has been submitted successfully to Google Sheets!'
      });
      setStep(6);
    } catch (err) {
      console.error(err);
      setSubmitResult({
        status: 'error',
        message: 'Failed to submit form: ' + err.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      dob: '',
      gender: '',
      permStreet: '',
      permVillage: '',
      permPostOffice: '',
      permCity: '',
      permBlock: '',
      permDistrict: '',
      permState: '',
      currStreet: '',
      currVillage: '',
      currPostOffice: '',
      currCity: '',
      currBlock: '',
      currDistrict: '',
      currState: '',
      isSameAddress: false,
      aadharNumber: '',
      aadharPhotoBase64: '',
      aadharPhotoName: '',
      aadharPhotoType: '',
      aadharPhotoSize: '',
      otherDocType: 'PAN Card',
      otherDocNumber: '',
      otherDocPhotoBase64: '',
      otherDocPhotoName: '',
      otherDocPhotoType: '',
      otherDocPhotoSize: '',
      signatureBase64: '',
      signatureName: '',
      signatureType: '',
      signatureSize: '',
      bankHolderName: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      emergencyName: '',
      emergencyRelation: '',
      emergencyPhone: ''
    });
    setStep(1);
    setSubmitResult(null);
  };

  const progressPercent = ((step - 1) / 4) * 100;

  return (
    <div className="kyc-container">
      <div className="kyc-content">
        
        {/* Header */}
        <div className="kyc-header">
          <h1>Employee KYC Portal</h1>
          <p>Complete your KYC details to register with human resources</p>
        </div>

        {/* Step Progress indicators */}
        {step <= 5 && (
          <div className="kyc-steps">
            <div className="kyc-steps-progress" style={{ width: `${progressPercent}%` }}></div>
            
            <div className={`step-node ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`} onClick={() => step < 5 && setStep(1)}>
              {step > 1 ? '✓' : '1'}
              <span className="step-node-label">Personal</span>
            </div>
            
            <div className={`step-node ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`} onClick={() => step < 5 && validateStep() && setStep(2)}>
              {step > 2 ? '✓' : '2'}
              <span className="step-node-label">Address</span>
            </div>
            
            <div className={`step-node ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`} onClick={() => step < 5 && validateStep() && setStep(3)}>
              {step > 3 ? '✓' : '3'}
              <span className="step-node-label">Identity</span>
            </div>
            
            <div className={`step-node ${step >= 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}`} onClick={() => step < 5 && validateStep() && setStep(4)}>
              {step > 4 ? '✓' : '4'}
              <span className="step-node-label">Bank & Emergency</span>
            </div>
            
            <div className={`step-node ${step === 5 ? 'active' : ''}`} onClick={() => step < 5 && validateStep() && setStep(5)}>
              5
              <span className="step-node-label">Review</span>
            </div>
          </div>
        )}

        {/* Form Screens */}
        <form onSubmit={handleSubmit}>
          
          {/* STEP 1: Personal Information */}
          {step === 1 && (
            <div className="form-section">
              <div className="form-grid">
                
                <div className="input-group grid-full-width">
                  <label htmlFor="fullName">Full Name <span>*</span></label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    placeholder="Enter your first and last name"
                    className={`input-field ${errors.fullName ? 'input-error' : ''}`}
                    value={formData.fullName}
                    onChange={handleInputChange}
                  />
                  {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                </div>

                <div className="input-group">
                  <label htmlFor="email">Email Address <span>*</span></label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="name@company.com"
                    className={`input-field ${errors.email ? 'input-error' : ''}`}
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="input-group">
                  <label htmlFor="phone">Mobile Number <span>*</span></label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="9876543210"
                    maxLength="10"
                    className={`input-field ${errors.phone ? 'input-error' : ''}`}
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>

                <div className="input-group">
                  <label htmlFor="dob">Date of Birth <span>*</span></label>
                  <input
                    type="date"
                    id="dob"
                    name="dob"
                    className={`input-field ${errors.dob ? 'input-error' : ''}`}
                    value={formData.dob}
                    onChange={handleInputChange}
                  />
                  {errors.dob && <span className="error-message">{errors.dob}</span>}
                </div>

                <div className="input-group">
                  <label htmlFor="gender">Gender <span>*</span></label>
                  <select
                    id="gender"
                    name="gender"
                    className={`input-field ${errors.gender ? 'input-error' : ''}`}
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <span className="error-message">{errors.gender}</span>}
                </div>

              </div>
            </div>
          )}

          {/* STEP 2: Address Information */}
          {step === 2 && (
            <div className="form-section">
              <div className="form-grid">
                
                {/* Permanent Address Breakdown */}
                <div className="input-group grid-full-width">
                  <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>Permanent Address</h3>
                </div>

                <div className="input-group grid-full-width">
                  <label htmlFor="permStreet">Street Address / House No. <span>*</span></label>
                  <input
                    type="text"
                    id="permStreet"
                    name="permStreet"
                    placeholder="House/Plot No, Street, Landmark"
                    className={`input-field ${errors.permStreet ? 'input-error' : ''}`}
                    value={formData.permStreet}
                    onChange={handleInputChange}
                  />
                  {errors.permStreet && <span className="error-message">{errors.permStreet}</span>}
                </div>

                <div className="input-group">
                  <label htmlFor="permVillage">Village <span>*</span></label>
                  <input
                    type="text"
                    id="permVillage"
                    name="permVillage"
                    placeholder="Village Name"
                    className={`input-field ${errors.permVillage ? 'input-error' : ''}`}
                    value={formData.permVillage}
                    onChange={handleInputChange}
                  />
                  {errors.permVillage && <span className="error-message">{errors.permVillage}</span>}
                </div>

                <div className="input-group">
                  <label htmlFor="permPostOffice">Post Office <span>*</span></label>
                  <input
                    type="text"
                    id="permPostOffice"
                    name="permPostOffice"
                    placeholder="Post Office"
                    className={`input-field ${errors.permPostOffice ? 'input-error' : ''}`}
                    value={formData.permPostOffice}
                    onChange={handleInputChange}
                  />
                  {errors.permPostOffice && <span className="error-message">{errors.permPostOffice}</span>}
                </div>

                <div className="input-group">
                  <label htmlFor="permCity">City / Town <span>*</span></label>
                  <input
                    type="text"
                    id="permCity"
                    name="permCity"
                    placeholder="City or Town"
                    className={`input-field ${errors.permCity ? 'input-error' : ''}`}
                    value={formData.permCity}
                    onChange={handleInputChange}
                  />
                  {errors.permCity && <span className="error-message">{errors.permCity}</span>}
                </div>

                <div className="input-group">
                  <label htmlFor="permBlock">Block / Tehsil <span>*</span></label>
                  <input
                    type="text"
                    id="permBlock"
                    name="permBlock"
                    placeholder="Block or Tehsil"
                    className={`input-field ${errors.permBlock ? 'input-error' : ''}`}
                    value={formData.permBlock}
                    onChange={handleInputChange}
                  />
                  {errors.permBlock && <span className="error-message">{errors.permBlock}</span>}
                </div>

                <div className="input-group">
                  <label htmlFor="permDistrict">District <span>*</span></label>
                  <input
                    type="text"
                    id="permDistrict"
                    name="permDistrict"
                    placeholder="District"
                    className={`input-field ${errors.permDistrict ? 'input-error' : ''}`}
                    value={formData.permDistrict}
                    onChange={handleInputChange}
                  />
                  {errors.permDistrict && <span className="error-message">{errors.permDistrict}</span>}
                </div>

                <div className="input-group">
                  <label htmlFor="permState">State <span>*</span></label>
                  <select
                    id="permState"
                    name="permState"
                    className={`input-field ${errors.permState ? 'input-error' : ''}`}
                    value={formData.permState}
                    onChange={handleInputChange}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {errors.permState && <span className="error-message">{errors.permState}</span>}
                </div>

                {/* Same Address Switch */}
                <div className="checkbox-group grid-full-width" style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
                  <label className="checkbox-container">
                    Current Address is same as Permanent Address
                    <input
                      type="checkbox"
                      name="isSameAddress"
                      checked={formData.isSameAddress}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark"></span>
                  </label>
                </div>

                {/* Current Address Breakdown */}
                {!formData.isSameAddress && (
                  <>
                    <div className="input-group grid-full-width">
                      <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>Current Address</h3>
                    </div>

                    <div className="input-group grid-full-width">
                      <label htmlFor="currStreet">Street Address / House No. <span>*</span></label>
                      <input
                        type="text"
                        id="currStreet"
                        name="currStreet"
                        placeholder="House/Plot No, Street, Landmark"
                        className={`input-field ${errors.currStreet ? 'input-error' : ''}`}
                        value={formData.currStreet}
                        onChange={handleInputChange}
                      />
                      {errors.currStreet && <span className="error-message">{errors.currStreet}</span>}
                    </div>

                    <div className="input-group">
                      <label htmlFor="currVillage">Village <span>*</span></label>
                      <input
                        type="text"
                        id="currVillage"
                        name="currVillage"
                        placeholder="Village Name"
                        className={`input-field ${errors.currVillage ? 'input-error' : ''}`}
                        value={formData.currVillage}
                        onChange={handleInputChange}
                      />
                      {errors.currVillage && <span className="error-message">{errors.currVillage}</span>}
                    </div>

                    <div className="input-group">
                      <label htmlFor="currPostOffice">Post Office <span>*</span></label>
                      <input
                        type="text"
                        id="currPostOffice"
                        name="currPostOffice"
                        placeholder="Post Office"
                        className={`input-field ${errors.currPostOffice ? 'input-error' : ''}`}
                        value={formData.currPostOffice}
                        onChange={handleInputChange}
                      />
                      {errors.currPostOffice && <span className="error-message">{errors.currPostOffice}</span>}
                    </div>

                    <div className="input-group">
                      <label htmlFor="currCity">City / Town <span>*</span></label>
                      <input
                        type="text"
                        id="currCity"
                        name="currCity"
                        placeholder="City or Town"
                        className={`input-field ${errors.currCity ? 'input-error' : ''}`}
                        value={formData.currCity}
                        onChange={handleInputChange}
                      />
                      {errors.currCity && <span className="error-message">{errors.currCity}</span>}
                    </div>

                    <div className="input-group">
                      <label htmlFor="currBlock">Block / Tehsil <span>*</span></label>
                      <input
                        type="text"
                        id="currBlock"
                        name="currBlock"
                        placeholder="Block or Tehsil"
                        className={`input-field ${errors.currBlock ? 'input-error' : ''}`}
                        value={formData.currBlock}
                        onChange={handleInputChange}
                      />
                      {errors.currBlock && <span className="error-message">{errors.currBlock}</span>}
                    </div>

                    <div className="input-group">
                      <label htmlFor="currDistrict">District <span>*</span></label>
                      <input
                        type="text"
                        id="currDistrict"
                        name="currDistrict"
                        placeholder="District"
                        className={`input-field ${errors.currDistrict ? 'input-error' : ''}`}
                        value={formData.currDistrict}
                        onChange={handleInputChange}
                      />
                      {errors.currDistrict && <span className="error-message">{errors.currDistrict}</span>}
                    </div>

                    <div className="input-group">
                      <label htmlFor="currState">State <span>*</span></label>
                      <select
                        id="currState"
                        name="currState"
                        className={`input-field ${errors.currState ? 'input-error' : ''}`}
                        value={formData.currState}
                        onChange={handleInputChange}
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      {errors.currState && <span className="error-message">{errors.currState}</span>}
                    </div>
                  </>
                )}

              </div>
            </div>
          )}

          {/* STEP 3: Identification & Upload Documents (Aadhar Mandatory, others optional) */}
          {step === 3 && (
            <div className="form-section">
              <div className="form-grid">
                
                {/* Section A: Aadhar Card (Mandatory) */}
                <div className="input-group grid-full-width">
                  <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem', marginBottom: '0.25rem' }}>Aadhar Card Verification (Mandatory)</h3>
                </div>

                <div className="input-group grid-full-width">
                  <label htmlFor="aadharNumber">Aadhar Number <span>*</span></label>
                  <input
                    type="text"
                    id="aadharNumber"
                    name="aadharNumber"
                    maxLength="12"
                    placeholder="Enter 12-digit Aadhar card number"
                    className={`input-field ${errors.aadharNumber ? 'input-error' : ''}`}
                    value={formData.aadharNumber}
                    onChange={handleInputChange}
                  />
                  {errors.aadharNumber && <span className="error-message">{errors.aadharNumber}</span>}
                </div>

                <div className="input-group grid-full-width">
                  <label>Upload Aadhar Card Copy (JPG, PNG or PDF) <span>*</span></label>
                  {!formData.aadharPhotoBase64 ? (
                    <div className="upload-zone" onClick={() => document.getElementById('aadharPhotoInput').click()}>
                      <svg className="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="upload-text">Drag and drop file or <span>browse</span> to upload Aadhar</p>
                      <p className="upload-hint">Max file size: 2.5 MB</p>
                      <input 
                        type="file" 
                        id="aadharPhotoInput" 
                        accept="image/*,application/pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileChange(e, 'aadharPhoto')}
                      />
                    </div>
                  ) : (
                    <div className="file-preview-card">
                      {formData.aadharPhotoType.startsWith('image/') ? (
                        <img src={formData.aadharPhotoBase64} alt="Aadhar preview" className="file-preview-thumb" />
                      ) : (
                        <div className="file-preview-icon">PDF</div>
                      )}
                      <div className="file-preview-info">
                        <div className="file-preview-name">{formData.aadharPhotoName}</div>
                        <div className="file-preview-size">{formData.aadharPhotoSize}</div>
                      </div>
                      <button type="button" className="btn-remove-file" onClick={() => removeFile('aadharPhoto')}>
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {errors.aadharPhoto && <span className="error-message">{errors.aadharPhoto}</span>}
                </div>

                {/* Section B: Other Document (Optional) */}
                <div className="input-group grid-full-width" style={{ marginTop: '1.5rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem', marginBottom: '0.25rem' }}>Secondary Document Verification (Optional)</h3>
                </div>

                <div className="input-group">
                  <label htmlFor="otherDocType">Select Document Type</label>
                  <select
                    id="otherDocType"
                    name="otherDocType"
                    className="input-field"
                    value={formData.otherDocType}
                    onChange={handleInputChange}
                  >
                    <option value="PAN Card">PAN Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="otherDocNumber">Document Number</label>
                  <input
                    type="text"
                    id="otherDocNumber"
                    name="otherDocNumber"
                    placeholder={`Enter optional ${formData.otherDocType} number`}
                    className={`input-field ${errors.otherDocNumber ? 'input-error' : ''}`}
                    value={formData.otherDocNumber}
                    onChange={handleInputChange}
                  />
                  {errors.otherDocNumber && <span className="error-message">{errors.otherDocNumber}</span>}
                </div>

                <div className="input-group grid-full-width">
                  <label>Upload Document Copy (Optional)</label>
                  {!formData.otherDocPhotoBase64 ? (
                    <div className="upload-zone" onClick={() => document.getElementById('otherDocInput').click()}>
                      <svg className="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="upload-text">Drag and drop file or <span>browse</span> to upload secondary proof</p>
                      <p className="upload-hint">Max file size: 2.5 MB</p>
                      <input 
                        type="file" 
                        id="otherDocInput" 
                        accept="image/*,application/pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileChange(e, 'otherDocPhoto')}
                      />
                    </div>
                  ) : (
                    <div className="file-preview-card">
                      {formData.otherDocPhotoType.startsWith('image/') ? (
                        <img src={formData.otherDocPhotoBase64} alt="ID preview" className="file-preview-thumb" />
                      ) : (
                        <div className="file-preview-icon">PDF</div>
                      )}
                      <div className="file-preview-info">
                        <div className="file-preview-name">{formData.otherDocPhotoName}</div>
                        <div className="file-preview-size">{formData.otherDocPhotoSize}</div>
                      </div>
                      <button type="button" className="btn-remove-file" onClick={() => removeFile('otherDocPhoto')}>
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {errors.otherDocPhoto && <span className="error-message">{errors.otherDocPhoto}</span>}
                </div>

                {/* Section C: Signature Upload (Mandatory) */}
                <div className="input-group grid-full-width" style={{ marginTop: '1.5rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem', marginBottom: '0.25rem' }}>Signature Verification (Mandatory)</h3>
                </div>

                <div className="input-group grid-full-width">
                  <label>Upload Signature Copy (Clear Image) <span>*</span></label>
                  {!formData.signatureBase64 ? (
                    <div className="upload-zone" onClick={() => document.getElementById('signatureInput').click()}>
                      <svg className="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <p className="upload-text">Drag and drop file or <span>browse</span> to upload signature</p>
                      <p className="upload-hint">Max file size: 2.5 MB</p>
                      <input 
                        type="file" 
                        id="signatureInput" 
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileChange(e, 'signature')}
                      />
                    </div>
                  ) : (
                    <div className="file-preview-card">
                      <img src={formData.signatureBase64} alt="Signature preview" className="file-preview-thumb" />
                      <div className="file-preview-info">
                        <div className="file-preview-name">{formData.signatureName}</div>
                        <div className="file-preview-size">{formData.signatureSize}</div>
                      </div>
                      <button type="button" className="btn-remove-file" onClick={() => removeFile('signature')}>
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {errors.signature && <span className="error-message">{errors.signature}</span>}
                </div>

              </div>
            </div>
          )}

          {/* STEP 4: Bank Details & Emergency Contacts */}
          {step === 4 && (
            <div className="form-section">
              <div className="form-grid">
                
                <div className="input-group grid-full-width">
                  <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem', marginBottom: '0.25rem' }}>Bank Salary Details</h3>
                </div>

                <div className="input-group">
                  <label htmlFor="bankHolderName">Account Holder Name <span>*</span></label>
                  <input
                    type="text"
                    id="bankHolderName"
                    name="bankHolderName"
                    placeholder="As printed in passbook"
                    className={`input-field ${errors.bankHolderName ? 'input-error' : ''}`}
                    value={formData.bankHolderName}
                    onChange={handleInputChange}
                  />
                  {errors.bankHolderName && <span className="error-message">{errors.bankHolderName}</span>}
                </div>

                <div className="input-group">
                  <label htmlFor="bankName">Bank Name <span>*</span></label>
                  <input
                    type="text"
                    id="bankName"
                    name="bankName"
                    placeholder="e.g. State Bank of India"
                    className={`input-field ${errors.bankName ? 'input-error' : ''}`}
                    value={formData.bankName}
                    onChange={handleInputChange}
                  />
                  {errors.bankName && <span className="error-message">{errors.bankName}</span>}
                </div>

                <div className="input-group">
                  <label htmlFor="accountNumber">Account Number <span>*</span></label>
                  <input
                    type="password"
                    id="accountNumber"
                    name="accountNumber"
                    placeholder="Enter savings/current bank account no"
                    className={`input-field ${errors.accountNumber ? 'input-error' : ''}`}
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                  />
                  {errors.accountNumber && <span className="error-message">{errors.accountNumber}</span>}
                </div>

                <div className="input-group">
                  <label htmlFor="ifscCode">IFSC Code <span>*</span></label>
                  <input
                    type="text"
                    id="ifscCode"
                    name="ifscCode"
                    placeholder="SBIN0001234"
                    maxLength="11"
                    className={`input-field ${errors.ifscCode ? 'input-error' : ''}`}
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    style={{ textTransform: 'uppercase' }}
                  />
                  {errors.ifscCode && <span className="error-message">{errors.ifscCode}</span>}
                </div>

                <div className="input-group grid-full-width" style={{ marginTop: '1rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem', marginBottom: '0.25rem' }}>Emergency Contact Details</h3>
                </div>

                <div className="input-group">
                  <label htmlFor="emergencyName">Contact Person Name <span>*</span></label>
                  <input
                    type="text"
                    id="emergencyName"
                    name="emergencyName"
                    placeholder="Full name of contact"
                    className={`input-field ${errors.emergencyName ? 'input-error' : ''}`}
                    value={formData.emergencyName}
                    onChange={handleInputChange}
                  />
                  {errors.emergencyName && <span className="error-message">{errors.emergencyName}</span>}
                </div>

                <div className="input-group">
                  <label htmlFor="emergencyRelation">Relationship <span>*</span></label>
                  <input
                    type="text"
                    id="emergencyRelation"
                    name="emergencyRelation"
                    placeholder="e.g. Spouse / Father / Friend"
                    className={`input-field ${errors.emergencyRelation ? 'input-error' : ''}`}
                    value={formData.emergencyRelation}
                    onChange={handleInputChange}
                  />
                  {errors.emergencyRelation && <span className="error-message">{errors.emergencyRelation}</span>}
                </div>

                <div className="input-group grid-full-width">
                  <label htmlFor="emergencyPhone">Emergency Contact Number <span>*</span></label>
                  <input
                    type="tel"
                    id="emergencyPhone"
                    name="emergencyPhone"
                    maxLength="10"
                    placeholder="Contact mobile number"
                    className={`input-field ${errors.emergencyPhone ? 'input-error' : ''}`}
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                  />
                  {errors.emergencyPhone && <span className="error-message">{errors.emergencyPhone}</span>}
                </div>

              </div>
            </div>
          )}

          {/* STEP 5: Final Review Panel */}
          {step === 5 && (
            <div className="form-section">
              <div className="review-summary">
                
                {/* Personal Section */}
                <div className="review-section">
                  <div className="review-section-title">Personal Details</div>
                  <div className="review-grid">
                    <div className="review-item">
                      <span className="review-label">Full Name</span>
                      <span className="review-value">{formData.fullName}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Email Address</span>
                      <span className="review-value">{formData.email}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Phone Number</span>
                      <span className="review-value">{formData.phone}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Date of Birth</span>
                      <span className="review-value">{formData.dob}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Gender</span>
                      <span className="review-value">{formData.gender}</span>
                    </div>
                  </div>
                </div>

                {/* Addresses */}
                <div className="review-section">
                  <div className="review-section-title">Address Details</div>
                  <div className="review-grid">
                    <div className="review-item grid-full-width" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                      <span className="review-label" style={{ color: 'var(--primary)', fontWeight: 600 }}>Permanent Address</span>
                      <span className="review-value" style={{ marginTop: '0.25rem' }}>
                        {formData.permStreet}, {formData.permVillage}, PO: {formData.permPostOffice}, City: {formData.permCity}, Block: {formData.permBlock}, Dist: {formData.permDistrict}, {formData.permState}
                      </span>
                    </div>
                    <div className="review-item grid-full-width">
                      <span className="review-label" style={{ color: 'var(--primary)', fontWeight: 600 }}>Current Address</span>
                      <span className="review-value" style={{ marginTop: '0.25rem' }}>
                        {formData.isSameAddress ? (
                          'Same as Permanent Address'
                        ) : (
                          `${formData.currStreet}, ${formData.currVillage}, PO: ${formData.currPostOffice}, City: ${formData.currCity}, Block: ${formData.currBlock}, Dist: ${formData.currDistrict}, ${formData.currState}`
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Identity & Upload Verification */}
                <div className="review-section">
                  <div className="review-section-title">Identity & File Proofs</div>
                  <div className="review-grid">
                    <div className="review-item">
                      <span className="review-label">Aadhar Number</span>
                      <span className="review-value">{formData.aadharNumber}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Aadhar Attachment</span>
                      <span className="review-value">📎 {formData.aadharPhotoName} ({formData.aadharPhotoSize})</span>
                    </div>
                    
                    {(formData.otherDocNumber.trim() || formData.otherDocPhotoBase64) && (
                      <>
                        <div className="review-item">
                          <span className="review-label">Secondary Document Type ({formData.otherDocType})</span>
                          <span className="review-value">{formData.otherDocNumber || 'Not Provided'}</span>
                        </div>
                        <div className="review-item">
                          <span className="review-label">Secondary Attachment</span>
                          <span className="review-value">{formData.otherDocPhotoName ? `📎 ${formData.otherDocPhotoName} (${formData.otherDocPhotoSize})` : 'Not Uploaded'}</span>
                        </div>
                      </>
                    )}

                    <div className="review-item grid-full-width" style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                      <span className="review-label">Signature Attachment</span>
                      <span className="review-value">📎 {formData.signatureName} ({formData.signatureSize})</span>
                    </div>
                  </div>
                </div>

                {/* Bank & Emergency */}
                <div className="review-section">
                  <div className="review-section-title">Bank Account & Emergency Contact</div>
                  <div className="review-grid">
                    <div className="review-item">
                      <span className="review-label">Account Holder</span>
                      <span className="review-value">{formData.bankHolderName}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Bank & IFSC</span>
                      <span className="review-value">{formData.bankName} ({formData.ifscCode})</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Account Number</span>
                      <span className="review-value">••••••••{formData.accountNumber.slice(-4)}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Emergency Person</span>
                      <span className="review-value">{formData.emergencyName} ({formData.emergencyRelation})</span>
                    </div>
                    <div className="review-item grid-full-width">
                      <span className="review-label">Emergency Phone</span>
                      <span className="review-value">{formData.emergencyPhone}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Actions panel */}
          {step <= 5 && (
            <div className="form-actions">
              {step > 1 ? (
                <button type="button" className="btn btn-secondary" onClick={prevStep} disabled={isSubmitting}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              ) : (
                <div></div>
              )}

              {step < 5 ? (
                <button type="button" className="btn btn-primary" onClick={nextStep}>
                  Next Step
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || !scriptUrl}>
                  {isSubmitting ? (
                    <>
                      <div className="spinner"></div>
                      Submitting Data...
                    </>
                  ) : (
                    <>
                      Submit KYC Application
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

        </form>

        {/* STEP 6: Success Screen */}
        {step === 6 && (
          <div className="success-screen">
            <div className="success-icon-container">
              <svg className="success-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2>KYC Details Saved!</h2>
            <p>
              Your KYC details along with the document attachments have been successfully sent and uploaded. 
              The entry is appended to the Google Sheet, and files are saved inside your Google Drive.
            </p>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>
              Submit Another Response
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
