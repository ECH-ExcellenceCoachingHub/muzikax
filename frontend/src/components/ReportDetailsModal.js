'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import Portal from './Portal';
export default function ReportDetailsModal({ isOpen, onClose, report, onUpdateStatus }) {
    if (!isOpen)
        return null;
    // Manage body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = 'unset';
        }
        // Cleanup function
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const status = formData.get('status');
        const notes = formData.get('adminNotes');
        onUpdateStatus(report._id, status, notes);
        onClose();
    };
    return (_jsx(Portal, { children: _jsx("div", { className: "fixed inset-0 bg-black/80 backdrop-blur-sm z-[100000] flex items-center justify-center p-4 pointer-events-auto", children: _jsx("div", { className: "bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-5xl max-h-[90vh] overflow-y-auto", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "text-xl font-bold text-white", children: "Report Details" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-white", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsxs("div", { className: "space-y-4 mb-6", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-400", children: "Reporter" }), _jsxs("p", { className: "text-white", children: [report.reporterId.name, " (", report.reporterId.email, ")"] })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-400", children: "Track" }), _jsx("p", { className: "text-white", children: report.trackId.title })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-400", children: "Reason" }), _jsx("p", { className: "text-white capitalize", children: report.reason })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-400", children: "Description" }), _jsx("p", { className: "text-white", children: report.description || 'No additional details provided' })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-400", children: "Reported On" }), _jsx("p", { className: "text-white", children: new Date(report.createdAt).toLocaleString() })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-400", children: "Status" }), _jsx("p", { className: "text-white capitalize", children: report.status })] }), report.adminNotes && (_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-400", children: "Admin Notes" }), _jsx("p", { className: "text-white", children: report.adminNotes })] })), report.resolvedAt && (_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-400", children: "Resolved On" }), _jsx("p", { className: "text-white", children: new Date(report.resolvedAt).toLocaleString() })] }))] }), _jsxs("form", { onSubmit: handleSubmit, className: "border-t border-gray-700 pt-4", children: [_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Update Status" }), _jsxs("select", { name: "status", defaultValue: report.status, className: "w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary", children: [_jsx("option", { value: "pending", children: "Pending" }), _jsx("option", { value: "reviewed", children: "Reviewed" }), _jsx("option", { value: "resolved", children: "Resolved" }), _jsx("option", { value: "dismissed", children: "Dismissed" })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Admin Notes" }), _jsx("textarea", { name: "adminNotes", defaultValue: report.adminNotes || '', rows: 3, className: "w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary", placeholder: "Add notes about this report..." })] }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 border border-gray-700 rounded-lg text-white hover:bg-gray-800/50 transition-colors", children: "Cancel" }), _jsx("button", { type: "submit", className: "px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-white transition-colors", children: "Update Status" })] })] })] }) }) }) }));
}
