import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const PublicBorrowing = () => {
    const { regulationId, token } = useParams();
    const [regulation, setRegulation] = useState(null);
    const [prefillData, setPrefillData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef(null);
    const idPhotoRef = useRef(null);
    const equipmentPhotoRef = useRef(null);

    // Determine if using token or regulation
    const isTokenBased = Boolean(token);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        companyName: '',
        phone: '',
        idNumber: '',
        equipmentName: ''
    });
    const [idPhotoFile, setIdPhotoFile] = useState(null);
    const [idPhotoPreview, setIdPhotoPreview] = useState(null);
    const [equipmentPhotoFile, setEquipmentPhotoFile] = useState(null);
    const [equipmentPhotoPreview, setEquipmentPhotoPreview] = useState(null);

    useEffect(() => {
        loadForm();
    }, [regulationId, token]);

    const loadForm = async () => {
        try {
            setLoading(true);

            if (isTokenBased) {
                // Token-based (one-time use link)
                const response = await api.get(`/equipment-borrowing/public/token/${token}`);
                setRegulation({
                    name: response.data.regulationName,
                    regulation_text: response.data.regulationText
                });
                // Pre-fill form data if provided when token was created
                if (response.data.customerName || response.data.equipmentName) {
                    const [firstName, ...lastNameParts] = (response.data.customerName || '').split(' ');
                    setPrefillData({
                        firstName: firstName || '',
                        lastName: lastNameParts.join(' ') || '',
                        phone: response.data.customerPhone || '',
                        equipmentName: response.data.equipmentName || ''
                    });
                    setFormData(prev => ({
                        ...prev,
                        firstName: firstName || '',
                        lastName: lastNameParts.join(' ') || '',
                        phone: response.data.customerPhone || '',
                        equipmentName: response.data.equipmentName || ''
                    }));
                }
            } else {
                // Legacy regulation-based URL
                const response = await api.get(`/equipment-borrowing/public/regulations/${regulationId}`);
                setRegulation(response.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Form not found or has already been submitted');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'id') {
                setIdPhotoFile(file);
                setIdPhotoPreview(reader.result);
            } else {
                setEquipmentPhotoFile(file);
                setEquipmentPhotoPreview(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    // Canvas drawing
    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        ctx.lineTo(x, y);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();
    };

    const stopDrawing = () => setIsDrawing(false);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const isCanvasEmpty = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        return !pixelData.some(channel => channel !== 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.firstName || !formData.lastName || !formData.phone || !formData.equipmentName) {
            alert('Please fill all required fields');
            return;
        }

        if (isCanvasEmpty()) {
            alert('Please draw your signature');
            return;
        }

        try {
            setSubmitting(true);
            const canvas = canvasRef.current;
            const signatureData = canvas.toDataURL('image/png');

            const submitData = new FormData();
            submitData.append('firstName', formData.firstName);
            submitData.append('lastName', formData.lastName);
            submitData.append('companyName', formData.companyName);
            submitData.append('phone', formData.phone);
            submitData.append('idNumber', formData.idNumber);
            submitData.append('equipmentName', formData.equipmentName);
            submitData.append('signatureData', signatureData);

            if (idPhotoFile) {
                submitData.append('idPhoto', idPhotoFile);
            }
            if (equipmentPhotoFile) {
                submitData.append('equipmentPhoto', equipmentPhotoFile);
            }

            // Use different endpoint based on URL type
            const submitUrl = isTokenBased
                ? `/equipment-borrowing/public/token/${token}/submit`
                : `/equipment-borrowing/public/regulations/${regulationId}/submit`;

            await api.post(submitUrl, submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setSubmitted(true);
        } catch (err) {
            alert('Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <i className="fas fa-spinner fa-spin text-4xl text-brand-red"></i>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
                    <i className="fas fa-exclamation-circle text-5xl text-red-500 mb-4"></i>
                    <h1 className="text-xl font-bold mb-2">Form Not Available</h1>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
                    <i className="fas fa-check-circle text-5xl text-green-500 mb-4"></i>
                    <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
                    <p className="text-gray-600 mb-4">Your borrowing form has been submitted.</p>
                    <p className="text-sm text-gray-500">You may close this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-brand-red text-white p-6">
                        <h1 className="text-2xl font-bold">{regulation.name}</h1>
                        <p className="text-red-100 mt-1">Equipment Borrowing Form</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Personal Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="firstName"
                                    required
                                    className="w-full border rounded-md p-3"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    required
                                    className="w-full border rounded-md p-3"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                <input
                                    type="text"
                                    name="companyName"
                                    className="w-full border rounded-md p-3"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    className="w-full border rounded-md p-3"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                                <input
                                    type="text"
                                    name="idNumber"
                                    className="w-full border rounded-md p-3"
                                    value={formData.idNumber}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        {/* ID Photo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">ID Photo (Optional)</label>
                            <input
                                ref={idPhotoRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => handleFileChange(e, 'id')}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => idPhotoRef.current?.click()}
                                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                <i className="fas fa-camera mr-2"></i> Take/Upload ID Photo
                            </button>
                            {idPhotoPreview && (
                                <img src={idPhotoPreview} alt="ID Preview" className="mt-2 h-24 rounded border" />
                            )}
                        </div>

                        {/* Equipment Info */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Equipment Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="equipmentName"
                                required
                                className="w-full border rounded-md p-3"
                                value={formData.equipmentName}
                                onChange={handleInputChange}
                            />
                        </div>

                        {/* Equipment Photo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Photo (Optional)</label>
                            <input
                                ref={equipmentPhotoRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => handleFileChange(e, 'equipment')}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => equipmentPhotoRef.current?.click()}
                                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                <i className="fas fa-camera mr-2"></i> Take/Upload Equipment Photo
                            </button>
                            {equipmentPhotoPreview && (
                                <img src={equipmentPhotoPreview} alt="Equipment Preview" className="mt-2 h-24 rounded border" />
                            )}
                        </div>

                        {/* Regulations */}
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Terms & Conditions</h2>
                            <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto text-sm whitespace-pre-wrap" dir="rtl">
                                {regulation.regulation_text}
                            </div>
                        </div>

                        {/* Signature */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Signature <span className="text-red-500">*</span>
                                </label>
                                <button type="button" onClick={clearCanvas} className="text-sm text-gray-500 hover:text-gray-700">
                                    <i className="fas fa-eraser mr-1"></i> Clear
                                </button>
                            </div>
                            <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                                <canvas
                                    ref={canvasRef}
                                    width={500}
                                    height={200}
                                    className="w-full touch-none cursor-crosshair"
                                    style={{ maxWidth: '100%', height: 'auto' }}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Sign above using mouse or touch</p>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 bg-brand-red text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                        >
                            {submitting ? (
                                <><i className="fas fa-spinner fa-spin mr-2"></i> Submitting...</>
                            ) : (
                                <><i className="fas fa-check mr-2"></i> Submit Form</>
                            )}
                        </button>

                        <p className="text-xs text-gray-500 text-center">
                            By signing, you agree to the terms above.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PublicBorrowing;
