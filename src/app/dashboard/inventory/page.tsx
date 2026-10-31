"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Search,
  Plus,
  PlusCircle,
  Edit,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  Layers,
  Download,
  Upload,
  AlertCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import axios from "axios";
import { cn } from "@/lib/utils";

const emptyProduct = { name: "", price: "", stock: "", sku: "", barcode: "", categoryId: "", image: "", formula: "", location: "" };;

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [newProduct, setNewProduct] = useState(emptyProduct);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("products");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  // Dynamic sizes lists state for dialogs
  const [newProductSizes, setNewProductSizes] = useState<any[]>([]);
  const [editProductSizes, setEditProductSizes] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const hasPharmacy = false;
  const hasRestaurant = false;
  const hasGym = true;
  const hasBakery = false;

  const pageTitle = hasPharmacy 
    ? "Pharmacy Catalog & Medicines" 
    : hasGym 
    ? "Supplement & Fitness Inventory" 
    : hasRestaurant 
    ? (hasBakery ? "Bakery Raw Stocks" : "Recipe & Raw Stocks") 
    : "Inventory Management";

  const pageDesc = hasPharmacy
    ? "Manage medicines, active formula ingredients, packaging, and expiry counts."
    : hasGym
    ? "Track supplement stocks, fitness beverages, accessories, and gym items."
    : hasRestaurant
    ? "Manage food items, sizes, ingredients, recipes, and raw kitchen stocks."
    : "Track stock levels, manage products, and monitor low inventory.";

  const addBtnLabel = hasPharmacy 
    ? "Add Medication" 
    : hasGym 
    ? "Add Gym Item" 
    : hasRestaurant 
    ? "Add Menu Item" 
    : "Add Product";

  const listLabel = hasPharmacy 
    ? "Medications List" 
    : hasGym 
    ? "Supplements List" 
    : hasRestaurant 
    ? "Menu Items" 
    : "Products List";

  // Waste stock dialog states
  const [wastingProduct, setWastingProduct] = useState<any | null>(null);
  const [isWasteDialogOpen, setIsWasteDialogOpen] = useState(false);
  const [wasteQty, setWasteQty] = useState("");
  const [wasteReason, setWasteReason] = useState("Damaged/Expired");

  const fetchAll = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        axios.get("/api/products"),
        axios.get("/api/categories")
      ]);
      setProducts(Array.isArray(pRes.data) ? pRes.data : []);
      setCategories(Array.isArray(cRes.data) ? cRes.data : []);
    } catch (err: any) {
      console.error("Inventory fetch error:", err);
      toast.error("Connectivity issue: " + (err.response?.data?.error || "Failed to load data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    axios.get("/api/auth/me").then(res => setUser(res.data)).catch(() => {});
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post("/api/products", {
        ...newProduct,
        categoryId: newProduct.categoryId || undefined,
        sizes: newProductSizes.length > 0 ? newProductSizes : undefined
      });
      toast.success("Product added successfully");
      setIsAddDialogOpen(false);
      setNewProduct(emptyProduct);
      setNewProductSizes([]);
      fetchAll();
    } catch {
      toast.error("Failed to add product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post("/api/categories", newCategory);
      toast.success("Category created");
      setIsCategoryModalOpen(false);
      setNewCategory({ name: "", description: "" });
      fetchAll();
    } catch {
      toast.error("Failed to create category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    setSubmitting(true);
    try {
      await axios.patch(`/api/products/${editProduct.id}`, {
        ...editProduct,
        sizes: editProductSizes.length > 0 ? editProductSizes : null
      });
      toast.success("Product updated successfully");
      setIsEditDialogOpen(false);
      setEditProduct(null);
      setEditProductSizes([]);
      fetchAll();
    } catch {
      toast.error("Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/products/${id}`);
      toast.success("Product deleted");
      fetchAll();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const handleLogWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wastingProduct || !wasteQty) return;
    setSubmitting(true);
    try {
      await axios.post(`/api/products/${wastingProduct.id}/waste`, {
        quantity: parseInt(wasteQty),
        reason: wasteReason
      });
      toast.success(`Logged ${wasteQty} wasted units successfully!`);
      setIsWasteDialogOpen(false);
      setWastingProduct(null);
      setWasteQty("");
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to log wasted stock");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportProducts = () => {
    try {
      const headers = ["name", "price", "stock", "sku", "barcode", "sizes"];
      const rows = products.map((p) => [
        `"${p.name.replace(/"/g, '""')}"`,
        p.price,
        p.stock,
        `"${(p.sku || "").replace(/"/g, '""')}"`,
        `"${(p.barcode || "").replace(/"/g, '""')}"`,
        `"${JSON.stringify(p.sizes || []).replace(/"/g, '""')}"`
      ]);
      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `licoz_inventory_backup_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Products exported successfully!");
    } catch {
      toast.error("Failed to export products");
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
        if (lines.length <= 1) return toast.error("CSV file is empty");
        
        let importedCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i];
          const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
          const parsedRow = matches.map(m => m.replace(/^"|"$/g, "").replace(/""/g, '"').trim());

          if (parsedRow.length > 0) {
            const name = parsedRow[0];
            const price = parseFloat(parsedRow[1]) || 0;
            const stock = parseInt(parsedRow[2]) || 0;
            const sku = parsedRow[3] || "";
            const barcode = parsedRow[4] || "";
            const sizesRaw = parsedRow[5] || "";
            
            let sizes = null;
            try {
              if (sizesRaw) sizes = JSON.parse(sizesRaw);
            } catch {}

            await axios.post("/api/products", {
              name,
              price,
              stock,
              sku,
              barcode,
              sizes
            });
            importedCount++;
          }
        }
        toast.success(`Successfully restored ${importedCount} products!`);
        fetchAll();
      } catch (err: any) {
        toast.error("Failed to import CSV: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = products.filter(p => {
    const sizesList = p.sizes ? (typeof p.sizes === "string" ? JSON.parse(p.sizes) : p.sizes) : [];
    const hasVariants = sizesList && sizesList.length > 0;
    const totalStock = hasVariants
      ? sizesList.reduce((acc: number, s: any) => acc + (parseInt(s.stock) || 0), 0)
      : (p.stock || 0);
    return totalStock <= p.minStock;
  }).length;

  const totalValue = products.reduce((acc, p) => {
    const sizesList = p.sizes ? (typeof p.sizes === "string" ? JSON.parse(p.sizes) : p.sizes) : [];
    const hasVariants = sizesList && sizesList.length > 0;
    if (hasVariants) {
      const variantsValue = sizesList.reduce((sum: number, s: any) => sum + ((parseFloat(s.price) || 0) * (parseInt(s.stock) || 0)), 0);
      return acc + variantsValue;
    }
    return acc + ((p.price || 0) * (p.stock || 0));
  }, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" /> {pageTitle}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">{pageDesc}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Backup/Export */}
          <Button
            variant="outline"
            onClick={handleExportProducts}
            className="rounded-xl h-12 px-4 font-bold border-slate-200 text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-all"
          >
            <Download className="w-5 h-5 text-blue-600" /> {hasPharmacy ? "Export Medicines" : hasGym ? "Export Catalog" : hasRestaurant ? "Export Menu" : "Export CSV"}
          </Button>

          {/* Restore/Import */}
          <label className="cursor-pointer">
            <div className="rounded-xl h-12 px-4 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all font-bold flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600" /> {hasPharmacy ? "Import Medicines" : hasGym ? "Import Catalog" : hasRestaurant ? "Import Menu" : "Import CSV"}
            </div>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleImportCSV} 
            />
          </label>

          <Button
            variant="outline"
            onClick={() => setIsCategoryModalOpen(true)}
            className="rounded-xl h-12 px-5 font-bold border-slate-200 text-slate-600"
          >
            <Layers className="mr-2 w-5 h-5" /> Categories
          </Button>

          <Button 
            onClick={() => {
              setNewProduct(emptyProduct);
              setNewProductSizes([]);
              setIsAddDialogOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 px-8 font-black text-lg shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center"
          >
            <Plus className="mr-2 w-6 h-6" /> {addBtnLabel}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1.5 rounded-2xl mb-6 flex flex-row flex-wrap items-center w-fit h-auto">
          <TabsTrigger value="products" className="rounded-xl px-6 py-2.5 font-bold text-sm tracking-tight transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 flex-1 min-w-[150px]">
            <Package className="w-4 h-4 mr-2 inline-block" /> {listLabel}
          </TabsTrigger>
          <TabsTrigger value="categories" className="rounded-xl px-6 py-2.5 font-bold text-sm tracking-tight transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 flex-1 min-w-[150px]">
            <Layers className="w-4 h-4 mr-2 inline-block" /> All Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Total Products</p>
                  <p className="text-3xl font-black text-slate-900">{products.length}</p>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ArrowUpDown className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Inventory Value</p>
                  <p className="text-3xl font-black text-slate-900">PKR {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-3xl bg-rose-50/30 border border-rose-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-rose-600/80 font-bold text-sm uppercase tracking-wider">Low Stock Alerts</p>
                  <p className="text-3xl font-black text-rose-600">{lowStockCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 flex items-center justify-between gap-6">
              <div className="relative group w-full sm:max-w-xs">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  placeholder={hasPharmacy ? "Search medicines, formula..." : hasRestaurant ? (hasBakery ? "Search bakery items, cake deals..." : "Search food items, deals...") : hasGym ? "Search memberships, supplements, drinks..." : "Search products..."}
                  className="pl-11 h-14 rounded-2xl bg-white border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all text-base font-bold"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-hide">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-5 px-6 font-bold text-slate-700 min-w-[200px]">Product Info</TableHead>
                    {hasPharmacy && <TableHead className="font-bold text-slate-700 min-w-[150px]">Formula</TableHead>}
                    <TableHead className="font-bold text-slate-700 min-w-[150px]">SKU / Barcode</TableHead>
                    <TableHead className="font-bold text-slate-700 min-w-[100px]">Price</TableHead>
                    <TableHead className="font-bold text-slate-700 min-w-[140px]">Stock Level</TableHead>
                    <TableHead className="text-right font-bold text-slate-700 px-6 min-w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={hasPharmacy ? 6 : 5} className="h-40 text-center text-slate-400 font-medium">
                        Loading inventory...
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={hasPharmacy ? 6 : 5} className="h-40 text-center text-slate-400 font-medium">
                        No products found. Add your first product.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            {!hasPharmacy && (
                              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                                {product.image ? (
                                  <img src={product.image} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <Package className="w-6 h-6 text-slate-400" />
                                )}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 line-clamp-1">{product.name}</p>
                              <p className="text-sm font-medium text-slate-500">{product.category?.name || "Uncategorized"}</p>
                            </div>
                          </div>
                        </TableCell>
                        {hasPharmacy && (
                          <TableCell className="font-semibold text-slate-600">
                            {product.formula || "—"}
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="space-y-1">
                            {product.sku && <p className="text-sm font-bold text-slate-700">SKU: {product.sku}</p>}
                            {product.barcode && <p className="text-xs text-slate-500 font-medium">BC: {product.barcode}</p>}
                            {!product.sku && !product.barcode && <span className="text-sm text-slate-400">-</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-black text-slate-900">PKR {product.price.toFixed(2)}</p>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const sizesList = product.sizes ? (typeof product.sizes === "string" ? JSON.parse(product.sizes) : product.sizes) : [];
                            const hasVariants = sizesList && sizesList.length > 0;
                            const totalStock = hasVariants
                              ? sizesList.reduce((acc: number, s: any) => acc + (parseInt(s.stock) || 0), 0)
                              : (product.stock || 0);
                            return (
                              <Badge className={cn(
                                "px-3 py-1 rounded-lg font-bold border",
                                totalStock > product.minStock
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : totalStock > 0
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                              )}>
                                {totalStock} in stock
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <div className="flex justify-end gap-1.5">
                            {/* Waste Stock Button */}
                            {product.type !== "DEAL" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 rounded-lg font-bold"
                                onClick={() => {
                                  setWastingProduct(product);
                                  setIsWasteDialogOpen(true);
                                }}
                              >
                                Waste
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-blue-600 hover:bg-blue-50 rounded-xl h-8 w-8 flex items-center justify-center"
                              onClick={() => {
                                let szList = [];
                                if (product.sizes) {
                                  szList = typeof product.sizes === "string" ? JSON.parse(product.sizes) : product.sizes;
                                }
                                setEditProduct({ ...product, price: String(product.price), stock: String(product.stock) });
                                setEditProductSizes(szList || []);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-rose-500 hover:bg-rose-50 rounded-xl h-8 w-8 flex items-center justify-center"
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="flex justify-end">
            <Button
              onClick={() => setIsCategoryModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-4 font-bold shadow-md shadow-blue-100 transition-all flex items-center text-xs"
            >
              <Plus className="mr-1.5 w-4 h-4" /> Add Category
            </Button>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="py-5 px-6 font-bold text-slate-700">Category Name</TableHead>
                  <TableHead className="font-bold text-slate-700">Description</TableHead>
                  <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="h-40 text-center text-slate-400">No categories found.</TableCell></TableRow>
                ) : (
                  categories.map(cat => (
                    <TableRow key={cat.id}>
                      <TableCell className="py-4 px-6 font-bold text-slate-900">{cat.name}</TableCell>
                      <TableCell className="text-slate-500 font-medium">{cat.description || "—"}</TableCell>
                      <TableCell className="text-right px-6">
                        <Button variant="ghost" size="icon" className="text-rose-500 hover:bg-rose-50 rounded-xl"
                          onClick={async () => {
                            if (confirm(`Delete category "${cat.name}"?`)) {
                              await axios.delete(`/api/categories/${cat.id}`);
                              fetchAll();
                            }
                          }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Product Modal Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[32px] p-0 border-none shadow-2xl overflow-hidden bg-white">
          <div className="p-8 overflow-y-auto max-h-[90vh]">
            <DialogHeader className="mb-6 text-left">
              <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">
                {hasPharmacy ? "Add Medication" : hasGym ? "Add supplements / item" : hasRestaurant ? "Add Menu Item" : "Add New Product"}
              </DialogTitle>
              <p className="text-slate-500 font-bold mt-1">
                {hasPharmacy ? "Fill in medication details and active formulas." : hasGym ? "Register a supplement or fitness item." : hasRestaurant ? "Add a new recipe dish or deal option." : "Fill in the details to add a product to your catalog."}
              </p>
            </DialogHeader>
            <form onSubmit={handleAddProduct} className="space-y-6">
              {/* Image Upload */}
              {!hasPharmacy && (
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer relative overflow-hidden group">
                  {newProduct.image ? (
                    <>
                      <img src={newProduct.image} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <PlusCircle className="w-10 h-10 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Plus className="w-10 h-10" />
                      <p className="text-sm font-bold tracking-tight">Upload Product Image</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewProduct({ ...newProduct, image: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              )}

              {hasPharmacy && (
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Formula (Generic Salt Name)</label>
                  <Input placeholder="e.g. Paracetamol 500mg" className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-lg font-bold px-5"
                    value={newProduct.formula || ""} onChange={e => setNewProduct({ ...newProduct, formula: e.target.value })} />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    {hasPharmacy ? "Medication Name" : hasGym ? "Supplement / Item Name" : hasRestaurant ? "Menu Item Name" : "Product Name"}
                  </label>
                  <Input required placeholder={hasPharmacy ? "e.g. Panadol 500mg" : hasRestaurant ? (hasBakery ? "e.g. Chocolate Fudge Cake" : "e.g. Zinger Burger") : hasGym ? "e.g. Whey Protein Powder" : "e.g. Wireless Mouse"} className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-lg font-bold px-5"
                    value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    {hasPharmacy ? "Therapeutic Category" : hasGym ? "Supplement Category" : hasRestaurant ? "Menu Category" : "Category"}
                  </label>
                  <select
                    className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-100 px-5 focus:bg-white transition-all outline-none text-lg font-bold appearance-none cursor-pointer"
                    value={newProduct.categoryId || ""}
                    onChange={e => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                  >
                    <option value="">No Category</option>
                    {(categories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Price (PKR)</label>
                  <Input required={newProductSizes.length === 0} type="number" step="0.01" placeholder="0.00" className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5"
                    value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    {hasPharmacy ? "Stock (Tablets/Packs)" : "Stock"}
                  </label>
                  <Input required={newProductSizes.length === 0} type="number" placeholder="0" className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5"
                    value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">SKU</label>
                  <Input placeholder="e.g. WM-001" className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5"
                    value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Barcode</label>
                  <Input placeholder="Scan barcode" className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5"
                    value={newProduct.barcode} onChange={e => setNewProduct({ ...newProduct, barcode: e.target.value })} />
                </div>
              </div>

              {/* Dynamic Sizes Builder Rows */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Sizes & Sizing Variants (Optional)</label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setNewProductSizes([...newProductSizes, { sizeName: "", price: "", stock: "" }])}
                    className="h-8 px-3 rounded-lg text-xs font-bold border-slate-200"
                  >
                    + Add Size Row
                  </Button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {newProductSizes.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input 
                        placeholder={hasPharmacy ? "Size (e.g. 10s Strip, 120ml)" : hasRestaurant ? "Size (e.g. Large, 1.5 Liters)" : "Size Name (e.g. Medium, XL)"}
                        className="h-10 rounded-xl bg-slate-50 border-slate-100 text-xs font-bold px-3 flex-[2]"
                        value={item.sizeName}
                        onChange={(e) => {
                          const copy = [...newProductSizes];
                          copy[idx].sizeName = e.target.value;
                          setNewProductSizes(copy);
                        }}
                      />
                      <Input 
                        type="number"
                        placeholder="Price"
                        className="h-10 rounded-xl bg-slate-50 border-slate-100 text-xs font-bold px-3 flex-[1.5]"
                        value={item.price}
                        onChange={(e) => {
                          const copy = [...newProductSizes];
                          copy[idx].price = e.target.value;
                          setNewProductSizes(copy);
                        }}
                      />
                      <Input 
                        type="number"
                        placeholder="Stock"
                        className="h-10 rounded-xl bg-slate-50 border-slate-100 text-xs font-bold px-3 flex-[1]"
                        value={item.stock}
                        onChange={(e) => {
                          const copy = [...newProductSizes];
                          copy[idx].stock = e.target.value;
                          setNewProductSizes(copy);
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => setNewProductSizes(newProductSizes.filter((_, i) => i !== idx))}
                        className="h-8 w-8 text-rose-500 rounded-lg p-0 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="flex-1 h-14 rounded-2xl font-black text-slate-500 hover:bg-slate-50">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-[2] h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-lg shadow-xl shadow-blue-100 text-white">
                  {submitting ? "Processing..." : "Save Product"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[32px] p-0 border-none shadow-2xl overflow-hidden bg-white">
          <div className="p-8 overflow-y-auto max-h-[90vh]">
            <DialogHeader className="mb-6 text-left">
              <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">
                {hasPharmacy ? "Edit Medication" : hasGym ? "Edit Gym Item" : hasRestaurant ? "Edit Menu Item" : "Edit Product"}
              </DialogTitle>
              <p className="text-slate-500 font-bold mt-1">
                {hasPharmacy ? "Update medication specifications and inventory details." : hasGym ? "Update gym item details and pricing." : hasRestaurant ? "Update menu recipe item specification." : "Update the details for your product."}
              </p>
            </DialogHeader>
            {editProduct && (
              <form onSubmit={handleEditProduct} className="space-y-6">
                {/* Image Upload */}
                {!hasPharmacy && (
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer relative overflow-hidden group">
                    {editProduct.image ? (
                      <>
                        <img src={editProduct.image} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center">
                          <PlusCircle className="w-10 h-10 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Plus className="w-10 h-10" />
                        <p className="text-sm font-bold tracking-tight">Upload Product Image</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditProduct({ ...editProduct, image: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                )}

                {hasPharmacy && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Formula (Generic Salt Name)</label>
                    <Input placeholder="e.g. Paracetamol 500mg" className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-lg font-bold px-5"
                      value={editProduct.formula || ""} onChange={e => setEditProduct({ ...editProduct, formula: e.target.value })} />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                      {hasPharmacy ? "Medication Name" : hasGym ? "Supplement / Item Name" : hasRestaurant ? "Menu Item Name" : "Product Name"}
                    </label>
                    <Input required placeholder="Product Name" className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-lg font-bold px-5"
                      value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                      {hasPharmacy ? "Therapeutic Category" : hasGym ? "Supplement Category" : hasRestaurant ? "Menu Category" : "Category"}
                    </label>
                    <select
                      className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-100 px-5 focus:bg-white transition-all outline-none text-lg font-bold appearance-none cursor-pointer"
                      value={editProduct.categoryId || ""}
                      onChange={e => setEditProduct({ ...editProduct, categoryId: e.target.value })}
                    >
                      <option value="">No Category</option>
                      {(categories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Price (PKR)</label>
                    <Input required={editProductSizes.length === 0} type="number" step="0.01" className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5"
                      value={editProduct.price} onChange={e => setEditProduct({ ...editProduct, price: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                      {hasPharmacy ? "Stock (Tablets/Packs)" : "Stock"}
                    </label>
                    <Input required={editProductSizes.length === 0} type="number" className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5"
                      value={editProduct.stock} onChange={e => setEditProduct({ ...editProduct, stock: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">SKU</label>
                    <Input className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5"
                      value={editProduct.sku || ""} onChange={e => setEditProduct({ ...editProduct, sku: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Barcode</label>
                    <Input className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5"
                      value={editProduct.barcode || ""} onChange={e => setEditProduct({ ...editProduct, barcode: e.target.value })} />
                  </div>
                </div>

                {/* Edit Sizing Variants Builder */}
                <div className="space-y-4 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Sizes & Sizing Variants (Optional)</label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditProductSizes([...editProductSizes, { sizeName: "", price: "", stock: "" }])}
                      className="h-8 px-3 rounded-lg text-xs font-bold border-slate-200"
                    >
                      + Add Size Row
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {editProductSizes.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input 
                          placeholder={hasPharmacy ? "Size (e.g. 10s Strip, 120ml)" : hasRestaurant ? "Size (e.g. Large, 1.5 Liters)" : "Size Name (e.g. Medium, XL)"}
                          className="h-10 rounded-xl bg-slate-50 border-slate-100 text-xs font-bold px-3 flex-[2]"
                          value={item.sizeName}
                          onChange={(e) => {
                            const copy = [...editProductSizes];
                            copy[idx].sizeName = e.target.value;
                            setEditProductSizes(copy);
                          }}
                        />
                        <Input 
                          type="number"
                          placeholder="Price"
                          className="h-10 rounded-xl bg-slate-50 border-slate-100 text-xs font-bold px-3 flex-[1.5]"
                          value={item.price}
                          onChange={(e) => {
                            const copy = [...editProductSizes];
                            copy[idx].price = e.target.value;
                            setEditProductSizes(copy);
                          }}
                        />
                        <Input 
                          type="number"
                          placeholder="Stock"
                          className="h-10 rounded-xl bg-slate-50 border-slate-100 text-xs font-bold px-3 flex-[1]"
                          value={item.stock}
                          onChange={(e) => {
                            const copy = [...editProductSizes];
                            copy[idx].stock = e.target.value;
                            setEditProductSizes(copy);
                          }}
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => setEditProductSizes(editProductSizes.filter((_, i) => i !== idx))}
                          className="h-8 w-8 text-rose-500 rounded-lg p-0 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="flex-1 h-14 rounded-2xl font-black text-slate-500 hover:bg-slate-50">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="flex-[2] h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-lg shadow-xl shadow-blue-100 text-white">
                    {submitting ? "Updating..." : "Update Product"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Waste Stock Logger Dialog Modal */}
      <Dialog open={isWasteDialogOpen} onOpenChange={setIsWasteDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2rem] p-8 bg-white border-none shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-amber-500" /> Log Wasted Stock
            </DialogTitle>
            <p className="text-sm font-semibold text-slate-400 mt-1">Deduct damaged, expired, or spilled stock for {wastingProduct?.name}</p>
          </DialogHeader>
          {wastingProduct && (
            <form onSubmit={handleLogWaste} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Quantity to Waste</label>
                <Input 
                  required 
                  type="number" 
                  min="1" 
                  max={wastingProduct.stock}
                  placeholder="e.g. 5" 
                  className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-lg font-bold px-5"
                  value={wasteQty} 
                  onChange={e => setWasteQty(e.target.value)} 
                />
                <p className="text-[10px] text-slate-400 font-semibold ml-1">Current available: {wastingProduct.stock} items</p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Reason / Notes</label>
                <select
                  className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-100 px-5 focus:bg-white transition-all outline-none text-base font-bold appearance-none cursor-pointer"
                  value={wasteReason}
                  onChange={e => setWasteReason(e.target.value)}
                >
                  <option value="Damaged/Expired">Damaged / Expired</option>
                  <option value="Spilled/Broken">Spilled / Broken</option>
                  <option value="Customer Return Void">Customer Return / Void</option>
                  <option value="Staff Intake Error">Staff Intake Error</option>
                </select>
              </div>

              <div className="pt-4 flex gap-4">
                <Button type="button" variant="ghost" onClick={() => setIsWasteDialogOpen(false)} className="flex-1 h-14 rounded-2xl font-black text-slate-500 hover:bg-slate-50">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !wasteQty} className="flex-[2] h-14 rounded-2xl bg-amber-600 hover:bg-amber-700 font-black text-lg shadow-xl shadow-amber-100 text-white flex items-center justify-center">
                  {submitting ? "Logging..." : "Deduct Stock"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Category Creation Dialog Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2rem] p-0 border-none shadow-2xl overflow-hidden bg-white">
          <div className="p-8">
            <DialogHeader className="mb-6 text-left">
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Layers className="w-6 h-6 text-blue-600" /> Create Category
              </DialogTitle>
              <p className="text-slate-500 font-bold mt-1">Organize your products catalog into easily navigatable tabs.</p>
            </DialogHeader>

            <form onSubmit={handleAddCategory} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Category Name *</label>
                <Input 
                  required 
                  placeholder={hasPharmacy ? "e.g. Tablets, Syrups" : hasRestaurant ? (hasBakery ? "e.g. Cakes, Pastry, Cafe" : "e.g. Fast Food, Drinks") : hasGym ? "e.g. Memberships, Supplements, Drinks" : "e.g. Electronics, Clothing"} 
                  className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-base font-bold px-5 focus:bg-white transition-all"
                  value={newCategory.name} 
                  onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Description (Optional)</label>
                <Input 
                  placeholder={hasPharmacy ? "e.g. Painkillers, Cough Syrups" : hasRestaurant ? (hasBakery ? "e.g. Birthday cakes, bakery items" : "e.g. Burgers, Pizza, Hotdogs") : hasGym ? "e.g. Whey proteins, energy drinks, monthly passes" : "e.g. Laptops, T-Shirts"} 
                  className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-base font-bold px-5 focus:bg-white transition-all"
                  value={newCategory.description} 
                  onChange={e => setNewCategory({ ...newCategory, description: e.target.value })} 
                />
              </div>

              <div className="pt-4 flex gap-4">
                <Button type="button" variant="ghost" onClick={() => setIsCategoryModalOpen(false)} className="flex-1 h-14 rounded-2xl font-black text-slate-500 hover:bg-slate-50">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-[2] h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-lg shadow-xl shadow-blue-100 text-white flex items-center justify-center">
                  {submitting ? "Creating..." : "Create Category"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
