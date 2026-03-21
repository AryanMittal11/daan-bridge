import React, { useState, useEffect } from "react";
import { Modal, Input, Button, Select } from "./UI";
import API from "../api";

interface GeneralInventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    inventoryItem?: any;
}

export const GeneralInventoryModal: React.FC<GeneralInventoryModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    inventoryItem,
}) => {
    const [category, setCategory] = useState("MONEY");
    const [name, setName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("USD");
    
    // Details for clothes
    const [clothingType, setClothingType] = useState("Shirt");
    const [size, setSize] = useState("M");

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (inventoryItem) {
                setCategory(inventoryItem.category);
                setName(inventoryItem.name);
                setQuantity(inventoryItem.quantity.toString());
                setUnit(inventoryItem.unit);
                if (inventoryItem.category === "CLOTHES" && inventoryItem.details) {
                    setClothingType(inventoryItem.details.type || "Shirt");
                    setSize(inventoryItem.details.size || "M");
                }
            } else {
                setCategory("MONEY");
                setName("");
                setQuantity("");
                if (category === "CLOTHES") setUnit("Items");
                else setUnit("USD");
                setClothingType("Shirt");
                setSize("M");
            }
        }
    }, [isOpen, inventoryItem]);

    // Name formatting hook for clothes
    useEffect(() => {
        if (!inventoryItem && category === "CLOTHES") {
            setName(`${clothingType} - Size ${size}`);
            setUnit("Items");
        }
    }, [category, clothingType, size, inventoryItem]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const payload: any = {
                category,
                name,
                quantity: parseFloat(quantity),
                unit,
            };

            if (category === "CLOTHES") {
                payload.details = { type: clothingType, size };
            }

            if (inventoryItem) {
                await API.put(`/inventory/general/edit/${inventoryItem.id}`, payload);
            } else {
                await API.post("/inventory/general/add", payload);
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
            title={inventoryItem ? "Edit General Inventory" : "Add General Inventory"}
        >
            <div className="space-y-4">
                {!inventoryItem && (
                    <>
                        <Select
                            label="Category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="MONEY">MONEY</option>
                            <option value="CLOTHES">CLOTHES</option>
                            <option value="FOOD">FOOD</option>
                            <option value="MEDICINE">MEDICINE</option>
                            <option value="OTHER">OTHER</option>
                        </Select>

                        {category === "CLOTHES" && (
                            <div className="grid grid-cols-2 gap-4">
                                <Select label="Clothing Type" value={clothingType} onChange={e => setClothingType(e.target.value)}>
                                    <option>Shirt</option>
                                    <option>Pant</option>
                                    <option>Dress</option>
                                    <option>Jacket</option>
                                    <option>Shoes</option>
                                    <option>Blanket</option>
                                </Select>
                                <Select label="Size" value={size} onChange={e => setSize(e.target.value)}>
                                    <option>XS</option>
                                    <option>S</option>
                                    <option>M</option>
                                    <option>L</option>
                                    <option>XL</option>
                                    <option>XXL</option>
                                </Select>
                            </div>
                        )}

                        <Input
                            label="Item Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Campaign Funds or Winter Blankets"
                            disabled={category === "CLOTHES"}
                        />
                        <Input
                            label="Unit"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            placeholder="e.g., USD, Pieces, Kg"
                        />
                    </>
                )}

                {inventoryItem && (
                    <div className="mb-2">
                        <span className="text-sm font-bold text-slate-500">Item: </span>
                        <span className="text-lg font-bold text-slate-800 dark:text-white">{inventoryItem.name} ({inventoryItem.category})</span>
                        {inventoryItem.category === "CLOTHES" && inventoryItem.details && (
                           <div className="text-sm mt-1 text-slate-500 bg-slate-100 dark:bg-slate-800 p-2 rounded inline-block">
                             <span className="font-semibold">Size:</span> {inventoryItem.details.size} | <span className="font-semibold">Type:</span> {inventoryItem.details.type}
                           </div>
                        )}
                    </div>
                )}

                <Input
                    label="Quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                />

                <Button
                    onClick={handleSubmit}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg"
                    disabled={loading || !quantity}
                >
                    {loading ? "Processing..." : inventoryItem ? "Update Quantity" : "Add to Inventory"}
                </Button>
            </div>
        </Modal>
    );
};
