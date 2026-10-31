"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import axios from "axios";
import { Package, Plus } from "lucide-react";

// Simple product definition for inventory advance
const emptyAdvProduct = {
  name: "",
  stock: "",
  location: "",
  sku: "",
  barcode: ""
};

export default function InventoryAdvancePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState(emptyAdvProduct);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("/api/inventory-advance");
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error("Failed to load inventory data");
    }
  };

  React.useEffect(() => {
    fetchProducts();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post("/api/inventory-advance", newProduct);
      toast.success("Stock added successfully");
      setIsAddOpen(false);
      setNewProduct(emptyAdvProduct);
      fetchProducts();
    } catch (err) {
      toast.error("Failed to add stock");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="w-8 h-8 text-blue-600" /> Inventory Advance (Super Admin)
        </h1>
        <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="mr-2 w-5 h-5" /> Add Stock
        </Button>
      </div>

      {/* Simple list */}
      <div className="bg-white rounded-xl shadow p-4">
        {products.length === 0 ? (
          <p className="text-center text-gray-500">No stock entries yet.</p>
        ) : (
          <ul className="space-y-2">
            {products.map((p) => (
              <li key={p.id} className="border-b pb-2 flex justify-between items-center">
                <span>{p.name} ({p.location}) – {p.stock} units</span>
                <span className="text-sm text-gray-500">SKU: {p.sku || "-"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[24px] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-xl font-semibold">Add New Stock</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="p-6 space-y-4">
            <Input
              placeholder="Product Name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              required
            />
            <Input
              placeholder="Location (Kitchen / Store)"
              value={newProduct.location}
              onChange={(e) => setNewProduct({ ...newProduct, location: e.target.value })}
              required
            />
            <Input
              placeholder="Stock Quantity"
              type="number"
              value={newProduct.stock}
              onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
              required
            />
            <Input
              placeholder="SKU (optional)"
              value={newProduct.sku}
              onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
            />
            <Input
              placeholder="Barcode (optional)"
              value={newProduct.barcode}
              onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
            />
            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {submitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
