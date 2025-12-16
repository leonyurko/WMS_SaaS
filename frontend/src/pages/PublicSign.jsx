import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const PublicSign = () => {
    const { formId } = useParams();
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef(null);

    const [formData, setFormData] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: ''
    });

    useEffect(() => {
        loadForm();
    }, [formId]);

    const loadForm = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/signatures/public/forms/${formId}`);
            setForm(response.data);
        } catch (err) {
            console.error('Failed to load form:', err);
            setError(err.response?.data?.message || 'Form not found or inactive');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Canvas drawing functions
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

    const stopDrawing = () => {
        setIsDrawing(false);
    };

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

        if (!formData.customerName.trim()) {
            alert('Please enter your name');
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

            await api.post(`/signatures/public/forms/${formId}/sign`, {
                ...formData,
                signatureData
            });

            setSubmitted(true);
        } catch (err) {
            console.error(err);
            alert('Failed to submit signature. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
                    <p className="text-gray-600">Loading form...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
                    <i className="fas fa-exclamation-circle text-5xl text-red-500 mb-4"></i>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Form Not Available</h1>
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
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
                    <p className="text-gray-600 mb-4">Your signature has been submitted successfully.</p>
                    <p className="text-sm text-gray-500">You may close this page now.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-blue-600 text-white p-6">
                        <h1 className="text-2xl font-bold">{form.name}</h1>
                        <p className="text-blue-100 mt-1">Please read and sign below</p>
                    </div>

                    {/* Regulation Text */}
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h2>
                        <div
                            className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap"
                            dir="rtl"
                            style={{ textAlign: 'right' }}
                        >
                            {form.regulation_text}
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="customerName"
                                    required
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3"
                                    value={formData.customerName}
                                    onChange={handleInputChange}
                                    placeholder="Enter your full name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                                <input
                                    type="email"
                                    name="customerEmail"
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3"
                                    value={formData.customerEmail}
                                    onChange={handleInputChange}
                                    placeholder="your@email.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                                <input
                                    type="tel"
                                    name="customerPhone"
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3"
                                    value={formData.customerPhone}
                                    onChange={handleInputChange}
                                    placeholder="050-123-4567"
                                />
                            </div>
                        </div>

                        {/* Signature Canvas */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Signature <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={clearCanvas}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
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
                            <p className="mt-1 text-xs text-gray-500">Draw your signature above using mouse or touch</p>
                        </div>

                        {/* Submit */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {submitting ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin mr-2"></i> Submitting...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-signature mr-2"></i> Submit Signature
                                    </>
                                )}
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 text-center">
                            By signing, you confirm that you have read and agree to the terms above.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PublicSign;
