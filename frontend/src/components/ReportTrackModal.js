'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function ReportTrackModal({ trackId, isOpen, onClose }) {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    if (!isOpen)
        return null;
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                    trackId,
                    reason,
                    description
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit report');
            }
            alert('Report submitted successfully!');
            onClose();
        }
        catch (err) {
            console.error('Error submitting report:', err);
            setError(err.message || 'An error occurred while submitting the report');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-bold text-white", children: "Report Track" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-white", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Reason for Report" }), _jsxs("select", { value: reason, onChange: (e) => setReason(e.target.value), required: true, className: "w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", children: [_jsx("option", { value: "", children: "Select a reason" }), _jsx("option", { value: "copyright", children: "Copyright infringement" }), _jsx("option", { value: "inappropriate", children: "Inappropriate content" }), _jsx("option", { value: "other", children: "Other" })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Additional Details (Optional)" }), _jsx("textarea", { value: description, onChange: (e) => setDescription(e.target.value), rows: 4, className: "w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent", placeholder: "Provide more details about why you're reporting this track..." })] }), error && (_jsx("div", { className: "mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm", children: error })), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 border border-gray-700 rounded-lg text-white hover:bg-gray-800/50 transition-colors", children: "Cancel" }), _jsx("button", { type: "submit", disabled: isSubmitting || !reason, className: `px-4 py-2 rounded-lg text-white transition-colors ${isSubmitting || !reason
                                        ? 'bg-gray-700 cursor-not-allowed'
                                        : 'bg-primary hover:bg-primary/90'}`, children: isSubmitting ? 'Submitting...' : 'Submit Report' })] })] })] }) }));
}
