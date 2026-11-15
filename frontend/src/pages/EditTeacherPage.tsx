import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hrApi } from '../features/hr/api';
import { isValidBdPhoneNumber } from '../shared/utils/validation';
import {
  Users,
  ArrowLeft,
  Camera,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Calendar,
  BadgeCheck,
  Eye,
  EyeOff,
  UploadCloud,
  ShieldAlert,
  Save,
  CreditCard,
  Fingerprint,
} from 'lucide-react';

export const EditTeacherPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employee_id: '',
    designation: 'Assistant Teacher',
    department: 'Science',
    qualification: '',
    phone_number: '017',
    joining_date: '',
    card_rfid: '',
    biometric_id: '',
    password: '',
  });

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeacher = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setLoadError(null);
        const data = await hrApi.getTeacherById(Number(id));
        setFormData({
          name: data.user?.name || '',
          email: data.user?.email || '',
          employee_id: data.employee_id || '',
          designation: data.designation || 'Assistant Teacher',
          department: data.department || 'Science',
          qualification: data.qualification || '',
          phone_number: data.phone_number || '',
          joining_date: data.joining_date || '',
          card_rfid: data.card_rfid || '',
          biometric_id: data.biometric_id || '',
          password: '',
        });
        setCurrentImageUrl(data.profile_picture_url || data.user?.profile_picture_url || null);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'response' in err) {
          const ax = err as { response?: { status?: number; data?: { message?: string } } };
          setLoadError(ax.response?.data?.message || 'Failed to load faculty record.');
        } else {
          setLoadError('Failed to load faculty record.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Profile image must be smaller than 5MB.');
        return;
      }
      setNewImageFile(file);
      setNewImagePreview(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const removeNewImage = () => {
    setNewImageFile(null);
    if (newImagePreview) {
      URL.revokeObjectURL(newImagePreview);
      setNewImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.name.trim()) {
      setErrorMessage('Teacher full name is required.');
      return;
    }

    if (!formData.email.trim()) {
      setErrorMessage('Teacher email address is required.');
      return;
    }

    if (formData.phone_number && !isValidBdPhoneNumber(formData.phone_number)) {
      setErrorMessage(
        'Please enter a valid 11-digit Bangladeshi mobile number starting with 01[3-9] (e.g. 01712345678).'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('email', formData.email.trim());
      data.append('employee_id', formData.employee_id.trim());
      data.append('designation', formData.designation);
      if (formData.department) data.append('department', formData.department);
      if (formData.qualification) data.append('qualification', formData.qualification.trim());
      if (formData.phone_number) data.append('phone_number', formData.phone_number.trim());
      if (formData.joining_date) data.append('joining_date', formData.joining_date);
      if (formData.card_rfid !== undefined) data.append('card_rfid', formData.card_rfid.trim());
      if (formData.biometric_id !== undefined) data.append('biometric_id', formData.biometric_id.trim());
      if (formData.password.trim()) data.append('password', formData.password.trim());

      if (newImageFile) {
        data.append('profile_picture', newImageFile);
      }

      await hrApi.updateTeacher(Number(id), data);
      setSuccessMessage('Faculty profile updated successfully!');

      setTimeout(() => {
        navigate(`/teachers/${id}`);
      }, 1200);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } };
        if (ax.response?.status === 403) {
          setErrorMessage('Unauthorized. Only users with the Admin role can update teacher records.');
        } else {
          const validationMsg = ax.response?.data?.message ||
            (ax.response?.data?.errors ? Object.values(ax.response.data.errors).flat().join(' ') : null);
          setErrorMessage(validationMsg || 'Failed to update faculty member.');
        }
      } else {
        setErrorMessage('Network error while updating faculty member.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Role Gate check
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-xs space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Administrator Role Required</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Only authorized users with an Admin or SuperAdmin role can perform CRUD modifications on faculty member profiles.
            </p>
          </div>
          <Link
            to="/teachers"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Faculty Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-500 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="text-sm font-medium">Loading faculty member data...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 py-8">
        <div className="flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-6 text-sm text-rose-800">
          <AlertCircle className="h-6 w-6 shrink-0 text-rose-500" />
          <div className="flex-1">
            <h3 className="font-bold text-base">Error Loading Faculty Record</h3>
            <p className="mt-1 text-xs text-rose-700">{loadError}</p>
          </div>
          <Link
            to="/teachers"
            className="rounded-xl bg-white border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100/50 transition-colors"
          >
            Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  const effectiveImagePreview = newImagePreview || currentImageUrl;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb & Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <Link
            to={`/teachers/${id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Faculty Profile</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            Edit Faculty Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Update employee ID, designation, academic department, and profile photograph
          </p>
        </div>

        <Link
          to={`/teachers/${id}`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-all cursor-pointer self-start sm:self-auto"
        >
          Cancel & View
        </Link>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 animate-in fade-in">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to Save Updates</p>
            <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <div className="flex-1">
            <p className="font-semibold">{successMessage}</p>
            <p className="text-xs text-emerald-700 mt-0.5">Redirecting to profile...</p>
          </div>
        </div>
      )}

      {/* Main Edit Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Photo Upload Section */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-2">
            <Camera className="h-4 w-4 text-indigo-600" />
            Profile Photograph
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Replace or update official faculty photo (PNG, JPG, or WEBP, max 5MB)
          </p>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative group shrink-0">
              <div className="h-28 w-28 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shadow-xs transition-all group-hover:border-indigo-400">
                {effectiveImagePreview ? (
                  <img
                    src={effectiveImagePreview}
                    alt="Teacher preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                    <Camera className="h-8 w-8 text-slate-300 mb-1" />
                    <span className="text-[10px] font-medium leading-tight">No Photo Selected</span>
                  </div>
                )}
              </div>

              {newImagePreview && (
                <button
                  type="button"
                  onClick={removeNewImage}
                  className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700 transition-colors cursor-pointer"
                  title="Remove new image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleImageChange}
                className="hidden"
                id="edit-profile-image-upload"
              />
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <label
                  htmlFor="edit-profile-image-upload"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-indigo-500 cursor-pointer transition-all"
                >
                  <UploadCloud className="h-4 w-4 text-indigo-600" />
                  <span>{newImageFile ? 'Change Selected Photo' : 'Upload New Photo'}</span>
                </label>

                {newImageFile && (
                  <span className="text-xs text-slate-500 font-mono">
                    {newImageFile.name} ({(newImageFile.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Leave untouched to keep the current photograph.
              </p>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-indigo-600" />
              General Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Anwar Hossain"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Employee ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP-101"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm font-mono text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Designation <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                >
                  <option value="Headmaster">Headmaster / Principal</option>
                  <option value="Assistant Headmaster">Assistant Headmaster</option>
                  <option value="Senior Teacher">Senior Teacher</option>
                  <option value="Assistant Teacher">Assistant Teacher</option>
                  <option value="Lecturer">Lecturer</option>
                  <option value="Junior Teacher">Junior Teacher</option>
                  <option value="Physical Instructor">Physical Instructor</option>
                  <option value="Librarian">Librarian</option>
                  <option value="Staff">Administrative Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Academic Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                >
                  <option value="Science">Science</option>
                  <option value="Humanities">Humanities</option>
                  <option value="Commerce">Commerce / Business Studies</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Language">Language (Bangla & English)</option>
                  <option value="ICT">Information & Communication Tech (ICT)</option>
                  <option value="General">General</option>
                  <option value="Religious Studies">Religious & Moral Education</option>
                  <option value="Arts & Crafts">Arts & Crafts</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Academic Qualification
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. M.Sc (DU), B.Ed, M.A in English (JU)"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Account Credentials */}
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-indigo-600" />
              Contact & Portal Account
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Mobile Number (BD)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="017XXXXXXXX"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3.5 text-sm font-mono text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  11-digit Bangladeshi mobile number (01[3-9]...).
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Email Address (Login ID) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="teacher@school.edu.bd"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Joining Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Attendance Card & Biometric IDs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                  RFID Smart Card UID
                </label>
                <input
                  type="text"
                  placeholder="e.g. TEACH-CARD-8899"
                  value={formData.card_rfid}
                  onChange={(e) => setFormData({ ...formData, card_rfid: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm font-mono text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-indigo-500" />
                  Biometric Terminal ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. BIO-T-100"
                  value={formData.biometric_id}
                  onChange={(e) => setFormData({ ...formData, biometric_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm font-mono text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Reset Password (Optional)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Leave blank to keep unchanged"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-10 text-sm font-mono text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Only enter a new password if you wish to reset this teacher's login credentials.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <Link
            to={`/teachers/${id}`}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
