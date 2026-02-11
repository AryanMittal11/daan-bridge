import React, { useEffect, useState } from 'react';
import { Modal, Button } from './UI';
import API from '@/api';

interface DonatorsListModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: any;
}

export const DonatorsListModal: React.FC<DonatorsListModalProps> = ({ isOpen, onClose, request }) => {
    const [pledges, setPledges] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && request) {
            fetchPledges();
        }
    }, [isOpen, request]);

    const fetchPledges = async () => {
        try {
            setLoading(true);
            const { data } = await API.get(`/blood/req/${request.id}/pledges`);
            setPledges(data.pledges || []);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Donators / Pledges">
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-4">Loading...</div>
                ) : pledges.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">No pledges yet.</div>
                ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {pledges.map((pledge) => (
                            <div key={pledge.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white">{pledge.name} ({pledge.donor?.name || 'User'})</p>
                                    <p className="text-xs text-slate-500">{pledge.contact}</p>
                                    <p className="text-xs text-slate-500">{pledge.address}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-red-600">{pledge.units} Units</span>
                                    <p className="text-xs text-slate-400">{new Date(pledge.createdAt).toLocaleDateString()}</p>
                                    <span className={`text-xs px-2 py-1 rounded ${pledge.status === 'FULFILLED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {pledge.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
            </div>
        </Modal>
    );
};
