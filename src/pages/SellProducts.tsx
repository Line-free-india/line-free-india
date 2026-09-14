import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import BackButton from '../components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { FaPlus, FaEdit, FaTrash, FaImage, FaTimes, FaShoppingBag } from 'react-icons/fa';

interface Product {
  id: string;
  businessId: string;
  name: string;
  description: string;
  price: number;
  imageURL: string;
  stock: number;
  createdAt: number;
}

export default function SellProducts() {
  const { user, businessProfile } = useApp();
  const nav = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'products'), where('businessId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const prods = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      prods.sort((a, b) => b.createdAt - a.createdAt);
      setProducts(prods);
      setLoading(false);
    }, err => {
      console.error('Products load error:', err);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = async () => {
          const MAX_WIDTH = 800;
          const scaleSize = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
          canvas.width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob(async (blob) => {
            if (!blob) {
              reject(new Error('Image compression failed'));
              return;
            }
            
            const filename = `products/${user?.uid}/${Date.now()}.jpg`;
            const storageRef = ref(storage, filename);
            
            try {
              await uploadBytes(storageRef, blob);
              const url = await getDownloadURL(storageRef);
              resolve(url);
            } catch (err) {
              reject(err);
            }
          }, 'image/jpeg', 0.8);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!name.trim() || !price || Number(price) <= 0 || !stock || Number(stock) < 0) {
      setError('Please fill all required fields correctly');
      triggerHaptic('error');
      return;
    }
    
    setUploading(true);
    setError('');
    
    try {
      let imageURL = editingProduct?.imageURL || '';
      
      if (imageFile) {
        imageURL = await uploadImage(imageFile);
      }
      
      const productData = {
        businessId: user.uid,
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        stock: Number(stock),
        imageURL,
        createdAt: editingProduct?.createdAt || Date.now(),
      };
      
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        showFeedback('Product Updated');
      } else {
        await addDoc(collection(db, 'products'), productData);
        showFeedback('Product Added');
      }
      
      triggerHaptic('success');
      closeModal();
    } catch (err: any) {
      console.error('Product save error:', err);
      setError(err.message || 'Failed to save product');
      triggerHaptic('error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Delete this product?')) return;
    
    try {
      await deleteDoc(doc(db, 'products', productId));
      showFeedback('Product Deleted');
      triggerHaptic('success');
    } catch (err) {
      console.error('Delete error:', err);
      showFeedback('Failed to delete');
      triggerHaptic('error');
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setName(product.name);
      setDescription(product.description);
      setPrice(product.price.toString());
      setStock(product.stock.toString());
      setImagePreview(product.imageURL);
    } else {
      setEditingProduct(null);
      setName('');
      setDescription('');
      setPrice('');
      setStock('');
      setImagePreview('');
    }
    setImageFile(null);
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setStock('');
    setImageFile(null);
    setImagePreview('');
    setError('');
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <span className="text-xs font-black uppercase px-2 py-1 rounded-full bg-danger/20 text-danger">Out of Stock</span>;
    if (stock <= 5) return <span className="text-xs font-black uppercase px-2 py-1 rounded-full bg-warning/20 text-warning">Low Stock</span>;
    return <span className="text-xs font-black uppercase px-2 py-1 rounded-full bg-success/20 text-success">In Stock</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text pb-32 overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] rounded-full opacity-10 blur-[120px]" style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-5 blur-[100px]" style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
      </div>

      <div className="px-5 app-header-safe pb-8">
        <div className="flex items-center justify-between mb-6">
          <BackButton to="/barber/home" />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openModal()}
            className="px-6 py-3 bg-primary text-black rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl"
          >
            <FaPlus /> Add Product
          </motion.button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl type-elite-display mb-2">Sell Products</h1>
          <p className="text-text-dim text-sm">Manage your product inventory</p>
        </div>

        {/* Feedback Toast */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="fixed top-10 left-1/2 -translate-x-1/2 z-[3000] elite-glass bg-white/5 border-primary/20 px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl flex items-center gap-3 text-primary"
            >
              <div className="w-2 h-2 rounded-full bg-primary animate-ping" /> {feedback}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products Grid */}
        {products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="elite-glass rounded-[3rem] p-12 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <FaShoppingBag className="text-5xl text-primary" />
            </div>
            <h2 className="text-2xl font-black mb-2">Start Selling Products</h2>
            <p className="text-text-dim mb-8">Add your first product to start selling</p>
            <button
              onClick={() => openModal()}
              className="px-8 py-4 bg-primary text-black rounded-2xl font-black uppercase tracking-widest shadow-xl"
            >
              Add Product
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="elite-glass rounded-[2.5rem] overflow-hidden border-white/5"
              >
                <div className="relative h-48 bg-card-2">
                  {product.imageURL ? (
                    <img src={product.imageURL} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaImage className="text-6xl text-text-dim opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    {getStockBadge(product.stock)}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-black mb-2">{product.name}</h3>
                  {product.description && (
                    <p className="text-text-dim text-sm mb-4 line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-primary">₹{product.price}</span>
                    <span className="text-sm text-text-dim">Stock: {product.stock}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(product)}
                      className="flex-1 py-3 rounded-xl elite-glass border-white/10 text-sm font-black flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="flex-1 py-3 rounded-xl elite-glass border-danger/20 text-danger text-sm font-black flex items-center justify-center gap-2 hover:bg-danger/10 transition-colors"
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={closeModal}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-card w-full max-w-lg rounded-[3rem] p-8 border border-border shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                <button
                  onClick={closeModal}
                  className="w-10 h-10 rounded-full bg-card-2 flex items-center justify-center hover:bg-danger/10 hover:text-danger transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="text-xs font-black uppercase text-text-dim mb-3 block tracking-widest">Product Image</label>
                  <div className="relative">
                    {imagePreview ? (
                      <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-3">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setImagePreview(''); setImageFile(null); }}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-danger flex items-center justify-center text-white"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      <label className="w-full h-48 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                        <FaImage className="text-4xl text-text-dim mb-2" />
                        <span className="text-sm text-text-dim">Click to upload image</span>
                        <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-xs font-black uppercase text-text-dim mb-3 block tracking-widest">Product Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter product name"
                    className="w-full bg-card-2 border border-border rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/30 text-text"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-black uppercase text-text-dim mb-3 block tracking-widest">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter product description"
                    rows={3}
                    className="w-full bg-card-2 border border-border rounded-2xl p-4 font-medium outline-none focus:ring-2 ring-primary/30 text-text resize-none"
                  />
                </div>

                {/* Price & Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black uppercase text-text-dim mb-3 block tracking-widest">Price (₹) *</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-full bg-card-2 border border-border rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/30 text-text"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase text-text-dim mb-3 block tracking-widest">Stock *</label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="0"
                      min="0"
                      step="1"
                      className="w-full bg-card-2 border border-border rounded-2xl p-4 font-bold outline-none focus:ring-2 ring-primary/30 text-text"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-2xl bg-danger/10 border border-danger/30 text-danger text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 p-5 rounded-2xl bg-card-2 font-black text-xs uppercase tracking-widest text-text-dim"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-[2] p-5 rounded-2xl bg-primary text-black font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-30 active:scale-95 transition-all"
                  >
                    {uploading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
