import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookPlus,
  ArrowLeft,
  BookOpen,
  MapPin,
  Layers,
  Save,
  CheckCircle,
  AlertCircle,
  Building,
  Barcode,
} from 'lucide-react';
import { libraryApi } from '../services/api';

const COMMON_CATEGORIES = [
  'Science',
  'Bangla Literature',
  'English',
  'Mathematics',
  'Computer Science',
  'History',
  'Islamic Studies',
  'Social Studies',
  'General Knowledge',
  'Reference & Dictionary',
  'Fiction & Story',
];

export const CreateBookPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    publisher: '',
    edition: '',
    publication_year: new Date().getFullYear().toString(),
    total_copies: 1,
    rack_number: '',
    description: '',
    cover_image: '',
    status: 'available' as 'available' | 'maintenance' | 'archived',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Math.max(1, parseInt(value, 10) || 1) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!formData.title.trim()) {
      setError('Book title is required.');
      return;
    }
    if (!formData.author.trim()) {
      setError('Author name is required.');
      return;
    }
    if (formData.total_copies < 1) {
      setError('Total copies must be at least 1.');
      return;
    }

    try {
      setSaving(true);
      const res = await libraryApi.createBook({
        title: formData.title.trim(),
        author: formData.author.trim(),
        isbn: formData.isbn.trim() || undefined,
        category: formData.category.trim() || undefined,
        publisher: formData.publisher.trim() || undefined,
        edition: formData.edition.trim() || undefined,
        publication_year: formData.publication_year.trim() || undefined,
        total_copies: formData.total_copies,
        rack_number: formData.rack_number.trim() || undefined,
        description: formData.description.trim() || undefined,
        cover_image: formData.cover_image.trim() || undefined,
        status: formData.status,
      });

      setSuccessMessage('Book created successfully! Redirecting...');
      setTimeout(() => {
        if (res.data?.id) {
          navigate(`/library/books/${res.data.id}`);
        } else {
          navigate('/library/books');
        }
      }, 1000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create book. Please verify your inputs.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/library/books"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BookPlus className="h-6 w-6 text-indigo-600" />
              Add New Book
            </h1>
            <p className="text-xs text-slate-500">
              Register a new book title and initial physical inventory copies to the school library
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Section 1: Book Essentials */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <BookOpen className="h-4 w-4 text-indigo-600" />
            Book Information
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Book Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Higher Secondary Physics Vol 1"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Author(s) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="author"
                required
                placeholder="e.g. Dr. Shahjahan Tapan"
                value={formData.author}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ISBN Number
              </label>
              <div className="relative">
                <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  name="isbn"
                  placeholder="e.g. 978-9843321501"
                  value={formData.isbn}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category / Subject
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="category"
                  placeholder="Type or select a category below..."
                  value={formData.category}
                  onChange={handleChange}
                  className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {/* Category chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {COMMON_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, category: cat }))}
                    className={`px-2.5 py-1 text-[11px] rounded-lg transition-colors ${
                      formData.category === cat
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Publication & Classification */}
        <div className="p-6 border-b border-slate-100 space-y-4 bg-slate-50/40">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Building className="h-4 w-4 text-indigo-600" />
            Publication & Edition Details
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Publisher</label>
              <input
                type="text"
                name="publisher"
                placeholder="e.g. Hasan Book House"
                value={formData.publisher}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Edition</label>
              <input
                type="text"
                name="edition"
                placeholder="e.g. 12th Edition"
                value={formData.edition}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Publication Year
              </label>
              <input
                type="text"
                name="publication_year"
                placeholder="e.g. 2024"
                value={formData.publication_year}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Inventory & Shelf Location */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Layers className="h-4 w-4 text-indigo-600" />
            Inventory Stock & Shelf Location
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Physical Copies <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="total_copies"
                min="1"
                required
                value={formData.total_copies}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Initially all copies will be set as available in stock.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rack / Shelf Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  name="rack_number"
                  placeholder="e.g. Rack A-1, Shelf 3"
                  value={formData.rack_number}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="available">Available for Loan</option>
                <option value="maintenance">Maintenance / Repair</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Summary / Course Notes
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Brief summary of the book, topics covered, or target curriculum..."
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/70 border-t border-slate-200">
          <Link
            to="/library/books"
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Registering Book...' : 'Save & Register Book'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateBookPage;
