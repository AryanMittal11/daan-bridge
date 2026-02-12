import React, { useState, useEffect } from "react";
import { Modal, Input, Button, Select } from "./UI";
import API from "@/api";

interface InventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    inventoryItem?: any; // If present, we are in EDIT mode
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    inventoryItem,
}) => {
    const [bloodType, setBloodType] = useState("A+");
    const [units, setUnits] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (inventoryItem) {
                setBloodType(inventoryItem.bloodType);
                setUnits(inventoryItem.units.toString());
            } else {
                setBloodType("A+");
                setUnits("");
            }
        }
    }, [isOpen, inventoryItem]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const payload = {
                bloodType,
                units: parseInt(units),
            };

            if (inventoryItem) {
                // Edit Mode
                await API.put(`/blood/edit/${inventoryItem.id}`, { units: payload.units });
            } else {
                // Add Mode
                await API.post("/blood/add", payload);
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            alert(error?.response?.data?.message || "Failed to update inventory");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={inventoryItem ? "Edit Inventory" : "Add Inventory"}
        >
            <div className="space-y-4">
                {!inventoryItem && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Blood Type
                        </label>
                        <Select
                            value={bloodType}
                            onChange={(e) => setBloodType(e.target.value)}
                        >
                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </Select>
                    </div>
                )}

                {inventoryItem && (
                    <div className="mb-2">
                        <span className="text-sm font-bold text-slate-500">Blood Type: </span>
                        <span className="text-lg font-bold text-red-600">{inventoryItem.bloodType}</span>
                    </div>
                )}

                <Input
                    label="Units (Total Available)"
                    type="number"
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                    placeholder="Enter number of units"
                />

                <Button
                    onClick={handleSubmit}
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={loading}
                >
                    {loading ? "Processing..." : inventoryItem ? "Update Inventory" : "Add to Inventory"}
                </Button>
            </div>
        </Modal>
    );
};
