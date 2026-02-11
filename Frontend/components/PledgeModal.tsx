import React, { useState } from 'react';
import { Modal, Input, Button } from './UI';
import API from '@/api';

interface PledgeModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: any;
    onSuccess: () => void;
}

export const PledgeModal: React.FC<PledgeModalProps> = ({ isOpen, onClose, request, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        contact: '',
        units: request?.units || 1
    });
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        if (request) {
            setFormData({
                name: '',
                address: '',
                contact: '',
                units: request.units
            });
        }
    }, [request, isOpen]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            await API.post(`/blood/req/pledge/${request.id}`, formData);
            setLoading(false);
            onSuccess();
            onClose();
        } catch (err: any) {
            setLoading(false);
            alert(err?.response?.data?.message || 'Failed to pledge');
        }
    };

    if (!request) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Pledge to Donate">
            <div className="space-y-4">
                {/* Static Data */}
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-sm space-y-2">
                    <div>
                        <span className="font-semibold text-slate-500">Request Location:</span>
                        <p className="font-medium text-slate-800 dark:text-white">{request.hospitalName}</p>
                    </div>
                    {request.organization && (
                        <div>
                            <span className="font-semibold text-slate-500">Hospital/Org Name:</span>
                            <p className="font-medium text-slate-800 dark:text-white">{request.organization.name}</p>
                        </div>
                    )}
                </div>

                {/* Form */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Blood Group</label>
                    <input
                        type="text"
                        value={request.bloodType}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-slate-500 cursor-not-allowed"
                        disabled
                    />
                    <p className="text-xs text-slate-500 mt-1">Must match requested blood group</p>
                </div>

                <Input
                    label="Pledge Units"
                    type="number"
                    value={formData.units}
                    onChange={(e) => setFormData({ ...formData, units: Number(e.target.value) })}
                    placeholder={`Max ${request.units}`}
                    min={1}
                    max={request.units}
                />

                <Input
                    label="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                />

                <Input
                    label="Your Address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter your current address"
                />

                <Input
                    label="Contact Number"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="Enter your mobile number"
                />

                <Button
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={handleSubmit}
                    disabled={loading || !formData.name || !formData.contact}
                >
                    {loading ? 'Processing...' : 'Continue'}
                </Button>
            </div>
        </Modal>
    );
};
