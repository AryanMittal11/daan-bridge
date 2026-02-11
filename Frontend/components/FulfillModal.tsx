import React, { useState } from 'react';
import { Modal, Input, Button } from './UI';
import API from '@/api';

interface FulfillModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: any;
    onSuccess: () => void;
}

export const FulfillModal: React.FC<FulfillModalProps> = ({ isOpen, onClose, request, onSuccess }) => {
    const [formData, setFormData] = useState({
        quantity: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            await API.post(`/blood/req/fulfill/${request.id}`, formData);
            setLoading(false);
            onSuccess();
            onClose();
        } catch (err: any) {
            setLoading(false);
            alert(err?.response?.data?.message || 'Failed to fulfill request');
        }
    };

    if (!request) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Fulfill Inventory">
            <div className="space-y-4">
                {/* Static Data */}
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-sm space-y-2">
                    <div>
                        <span className="font-semibold text-slate-500">Request Location:</span>
                        <p className="font-medium text-slate-800 dark:text-white">{request.hospitalName}</p>
                    </div>
                    {request.organization && (
                        <div>
                            <span className="font-semibold text-slate-500">Source Location (Requester):</span>
                            <p className="font-medium text-slate-800 dark:text-white">{request.organization.location || 'N/A'}</p>
                        </div>
                    )}
                </div>

                {/* Form */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Requested Quantity</label>
                    <div className="text-lg font-bold text-red-600">{request.units} Units</div>
                </div>

                <Input
                    label="Fulfill Quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder={`Enter quantity (Max: ${request.units})`}
                />

                <Input
                    label="Your Address (Pickup Location)"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter your organization address"
                />

                <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleSubmit}
                    disabled={loading || !formData.quantity || !formData.address}
                >
                    {loading ? 'Processing...' : 'Fulfill'}
                </Button>
            </div>
        </Modal>
    );
};
