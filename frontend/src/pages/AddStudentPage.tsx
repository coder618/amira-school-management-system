import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { academicApi } from '../features/academic/api';
import { ClassLevel, Section, Shift } from '../features/academic/types';
import { isValidBdPhoneNumber } from '../shared/utils/validation';
import {
  UserPlus,
  ArrowLeft,
  X,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  GraduationCap,
  Phone,
  Lock,
  CreditCard,
  Fingerprint,
} from 'lucide-react';

export const AddStudentPage: React.FC = () => {
  const navigate = useNavigate();

  // Reference data
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    student_id: `STU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    roll_number: 1,
    first_name: '',
    last_name: '',
    father_name: '',
    mother_name: '',
    phone_number: '017',
    email: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    status: 'active' as 'active' | 'inactive' | 'graduated' | 'suspended',
    class_level_id: 0,
    section_id: 0,
    shift_id: 0,
    date_of_birth: '',
    card_rfid: '',
    biometric_id: '',
    address: '',
    password: 'student123',
    enrollment_date: new Date().toISOString().split('T')[0],
  });

  // Image files & previews
  const [studentImageFile, setStudentImageFile] = useState<File | null>(null);
  const [studentImagePreview, setStudentImagePreview] = useState<string | null>(null);

  const [parentImageFile, setParentImageFile] = useState<File | null>(null);
  const [parentImagePreview, setParentImagePreview] = useState<string | null>(null);

  const [motherImageFile, setMotherImageFile] = useState<File | null>(null);
  const [motherImagePreview, setMotherImagePreview] = useState<string | null>(null);

  const studentImgInputRef = useRef<HTMLInputElement>(null);
  const parentImgInputRef = useRef<HTMLInputElement>(null);
  const motherImgInputRef = useRef<HTMLInputElement>(null);

  // Status & Validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load classes, sections, shifts
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setLoadingMetadata(true);
        const [classesData, sectionsData, shiftsData] = await Promise.all([
          academicApi.getClassLevels(),
          academicApi.getSections(),
          academicApi.getShifts(),
        ]);
        setClassLevels(classesData);
        setSections(sectionsData);
        setShifts(shiftsData);

        if (classesData.length > 0) {
          setFormData((prev) => ({
            ...prev,
            class_level_id: classesData[0].id,
            section_id: sectionsData[0]?.id || 0,
            shift_id: shiftsData[0]?.id || 0,
          }));
        }
      } catch (err) {
        console.error('Failed to load classes or sections', err);
      } finally {
        setLoadingMetadata(false);
      }
    };

    loadMetadata();
  }, []);

  // Filter sections when class level changes
  const filteredSections = sections.filter(
    (sec) => !formData.class_level_id || sec.class_level_id === formData.class_level_id
  );

  // Handle student image selection
  const handleStudentImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Student image must be smaller than 5MB.');
        return;
      }
      setStudentImageFile(file);
      setStudentImagePreview(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const removeStudentImage = () => {
    setStudentImageFile(null);
    if (studentImagePreview) {
      URL.revokeObjectURL(studentImagePreview);
      setStudentImagePreview(null);
    }
    if (studentImgInputRef.current) {
      studentImgInputRef.current.value = '';
    }
  };

  // Handle father/parent image selection
  const handleParentImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Parent image must be smaller than 5MB.');
        return;
      }
      setParentImageFile(file);
      setParentImagePreview(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const removeParentImage = () => {
    setParentImageFile(null);
    if (parentImagePreview) {
      URL.revokeObjectURL(parentImagePreview);
      setParentImagePreview(null);
    }
    if (parentImgInputRef.current) {
      parentImgInputRef.current.value = '';
    }
  };

  // Handle mother image selection
  const handleMotherImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Mother image must be smaller than 5MB.');
        return;
      }
      setMotherImageFile(file);
      setMotherImagePreview(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const removeMotherImage = () => {
    setMotherImageFile(null);
    if (motherImagePreview) {
      URL.revokeObjectURL(motherImagePreview);
      setMotherImagePreview(null);
    }
    if (motherImgInputRef.current) {
      motherImgInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate phone number
    if (!isValidBdPhoneNumber(formData.phone_number)) {
      setErrorMessage(
        'Please enter a valid 11-digit Bangladeshi mobile number starting with 01[3-9] (e.g. 01712345678).'
      );
      return;
    }

    if (!formData.class_level_id) {
      setErrorMessage('Please select a valid Class Level.');
      return;
    }

    if (!formData.section_id && filteredSections.length > 0) {
      setFormData((prev) => ({ ...prev, section_id: filteredSections[0].id }));
    }

    setIsSubmitting(true);

    try {
      // Build FormData for multipart payload with file uploads
      const data = new FormData();
      data.append('student_id', formData.student_id);
      data.append('roll_number', String(formData.roll_number));
      data.append('first_name', formData.first_name);
      if (formData.last_name) data.append('last_name', formData.last_name);
      data.append('father_name', formData.father_name);
      data.append('mother_name', formData.mother_name);
      data.append('phone_number', formData.phone_number);
      if (formData.email) data.append('email', formData.email);
      data.append('gender', formData.gender);
      data.append('status', formData.status);
      data.append('class_level_id', String(formData.class_level_id));
      data.append('section_id', String(formData.section_id || filteredSections[0]?.id || 1));
      if (formData.shift_id) data.append('shift_id', String(formData.shift_id));
      if (formData.date_of_birth) data.append('date_of_birth', formData.date_of_birth);
      if (formData.card_rfid) data.append('card_rfid', formData.card_rfid);
      if (formData.biometric_id) data.append('biometric_id', formData.biometric_id);
      if (formData.address) data.append('address', formData.address);
      if (formData.enrollment_date) data.append('enrollment_date', formData.enrollment_date);
      if (formData.password) data.append('password', formData.password);

      // Attached image files
      if (studentImageFile) {
        data.append('student_image', studentImageFile);
      }
      if (parentImageFile) {
        data.append('parent_image', parentImageFile);
        data.append('father_image', parentImageFile);
      }
      if (motherImageFile) {
        data.append('mother_image', motherImageFile);
      }

      await academicApi.createStudent(data);

      setSuccessMessage(`Student ${formData.first_name} enrolled successfully! Images stored in tenant media.`);
      
      // Reset form after short delay or offer navigation
      setTimeout(() => {
        navigate('/students');
      }, 1500);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        const msg = ax.response?.data?.message;
        const errors = ax.response?.data?.errors;
        if (errors) {
          const detail = Object.values(errors).flat().join(' ');
          setErrorMessage(detail || msg || 'Failed to enroll student.');
        } else {
          setErrorMessage(msg || 'Failed to enroll student.');
        }
      } else {
        setErrorMessage('An unexpected error occurred while saving student.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-4 px-2 sm:px-4 space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/students"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors shadow-xs"
            title="Back to Students Directory"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <UserPlus className="h-7 w-7 text-indigo-600" />
              Add Student
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Enroll new student and upload student & parent photos (saved in tenant media storage)
            </p>
          </div>
        </div>

        <Link
          to="/students"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs self-start sm:self-auto"
        >
          <Users className="h-4 w-4 text-indigo-600" />
          <span>View Student List</span>
        </Link>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 animate-in fade-in">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Enrollment Error: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMessage} Redirecting to student directory...</span>
        </div>
      )}

      {loadingMetadata ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
          <span className="text-sm font-medium text-slate-500">Loading academic classes & sections...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Photos & Media (Tenant Media Module) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Camera className="h-4 w-4 text-indigo-600" />
                Student & Parent Photos
              </h2>
              <p className="text-xs text-slate-500">
                Uploaded images are saved in tenant storage (Cloudflare R2 compatible). Supports JPG, PNG, WEBP (Max 5MB).
              </p>
            </div>
            <span className="hidden sm:inline-block px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full">
              Media Module Scoped
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Student Photo */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
                Student Photo *
              </span>
              <div className="relative mb-3">
                {studentImagePreview ? (
                  <div className="relative group">
                    <img
                      src={studentImagePreview}
                      alt="Student Preview"
                      className="w-28 h-28 object-cover rounded-2xl border-2 border-indigo-500 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={removeStudentImage}
                      className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700 transition-colors"
                      title="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => studentImgInputRef.current?.click()}
                    className="w-28 h-28 rounded-2xl border-2 border-slate-200 bg-white flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-xs"
                  >
                    <Camera className="h-8 w-8 mb-1" />
                    <span className="text-[11px] font-semibold">Upload Photo</span>
                  </div>
                )}
              </div>
              <input
                ref={studentImgInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={handleStudentImageChange}
              />
              <button
                type="button"
                onClick={() => studentImgInputRef.current?.click()}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                {studentImageFile ? 'Change Student Photo' : 'Browse Student Photo'}
              </button>
              <span className="text-[10px] text-slate-400 mt-1">Official Student ID photo</span>
            </div>

            {/* Father / Primary Parent Photo */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
                Father / Guardian Photo
              </span>
              <div className="relative mb-3">
                {parentImagePreview ? (
                  <div className="relative group">
                    <img
                      src={parentImagePreview}
                      alt="Parent Preview"
                      className="w-28 h-28 object-cover rounded-2xl border-2 border-indigo-500 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={removeParentImage}
                      className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700 transition-colors"
                      title="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => parentImgInputRef.current?.click()}
                    className="w-28 h-28 rounded-2xl border-2 border-slate-200 bg-white flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-xs"
                  >
                    <Users className="h-8 w-8 mb-1" />
                    <span className="text-[11px] font-semibold">Upload Photo</span>
                  </div>
                )}
              </div>
              <input
                ref={parentImgInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={handleParentImageChange}
              />
              <button
                type="button"
                onClick={() => parentImgInputRef.current?.click()}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                {parentImageFile ? 'Change Father Photo' : 'Browse Father Photo'}
              </button>
              <span className="text-[10px] text-slate-400 mt-1">Father or primary guardian</span>
            </div>

            {/* Mother Photo */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
                Mother Photo
              </span>
              <div className="relative mb-3">
                {motherImagePreview ? (
                  <div className="relative group">
                    <img
                      src={motherImagePreview}
                      alt="Mother Preview"
                      className="w-28 h-28 object-cover rounded-2xl border-2 border-indigo-500 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={removeMotherImage}
                      className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700 transition-colors"
                      title="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => motherImgInputRef.current?.click()}
                    className="w-28 h-28 rounded-2xl border-2 border-slate-200 bg-white flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-xs"
                  >
                    <Users className="h-8 w-8 mb-1" />
                    <span className="text-[11px] font-semibold">Upload Photo</span>
                  </div>
                )}
              </div>
              <input
                ref={motherImgInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={handleMotherImageChange}
              />
              <button
                type="button"
                onClick={() => motherImgInputRef.current?.click()}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                {motherImageFile ? 'Change Mother Photo' : 'Browse Mother Photo'}
              </button>
              <span className="text-[10px] text-slate-400 mt-1">Mother record photo</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: Academic Placement */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-indigo-600" />
                Academic Placement
              </h2>
              <p className="text-xs text-slate-500">Assign student ID, class level, section, and shift</p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Student ID *
              </label>
              <input
                type="text"
                required
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm font-mono font-bold text-slate-900 bg-white focus:border-indigo-600 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400">Unique SIS ID</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Class Level *
              </label>
              <select
                required
                value={formData.class_level_id}
                onChange={(e) => {
                  const classId = parseInt(e.target.value);
                  const firstSec = sections.find((s) => s.class_level_id === classId);
                  setFormData({
                    ...formData,
                    class_level_id: classId,
                    section_id: firstSec ? firstSec.id : formData.section_id,
                  });
                }}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm bg-white font-medium text-slate-800 focus:border-indigo-600 focus:outline-hidden"
              >
                {classLevels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400">Class Grade</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Section *
              </label>
              <select
                required
                value={formData.section_id}
                onChange={(e) => setFormData({ ...formData, section_id: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm bg-white font-medium text-slate-800 focus:border-indigo-600 focus:outline-hidden"
              >
                {filteredSections.length > 0 ? (
                  filteredSections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                ) : (
                  sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                )}
              </select>
              <span className="text-[10px] text-slate-400">Section Group</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Roll Number *
              </label>
              <input
                type="number"
                min={1}
                required
                value={formData.roll_number}
                onChange={(e) => setFormData({ ...formData, roll_number: parseInt(e.target.value) || 1 })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm font-bold text-indigo-700 bg-white focus:border-indigo-600 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400">Class Roll</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Academic Shift
              </label>
              <select
                value={formData.shift_id}
                onChange={(e) => setFormData({ ...formData, shift_id: parseInt(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm bg-white text-slate-800 focus:border-indigo-600 focus:outline-hidden"
              >
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} Shift
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Enrollment Date
              </label>
              <input
                type="date"
                value={formData.enrollment_date}
                onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm bg-white text-slate-800 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm bg-white font-semibold text-emerald-700 focus:border-indigo-600 focus:outline-hidden"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="graduated">Graduated</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                RFID Smart Card UID
              </label>
              <input
                type="text"
                placeholder="e.g. RFID-998877"
                value={formData.card_rfid}
                onChange={(e) => setFormData({ ...formData, card_rfid: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm font-mono bg-white text-slate-800 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-indigo-500" />
                Biometric Device ID
              </label>
              <input
                type="text"
                placeholder="e.g. BIO-101"
                value={formData.biometric_id}
                onChange={(e) => setFormData({ ...formData, biometric_id: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm font-mono bg-white text-slate-800 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Student Personal Information */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              Student Personal Details
            </h2>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                First Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tahmid"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm bg-white font-medium text-slate-900 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                placeholder="e.g. Rahman"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm bg-white font-medium text-slate-900 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm bg-white text-slate-800 focus:border-indigo-600 focus:outline-hidden"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm bg-white text-slate-800 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Student Email (Optional)
              </label>
              <input
                type="email"
                placeholder="Auto-generated if left blank"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm bg-white text-slate-800 focus:border-indigo-600 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400">Defaults to stu[id]@student.school.edu.bd</span>
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Residential Address
              </label>
              <input
                type="text"
                placeholder="House, Road, Thana, District"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm bg-white text-slate-800 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Parents & Contact Information */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Phone className="h-4 w-4 text-indigo-600" />
              Parents & Emergency Contact
            </h2>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Father's Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Md. Mostafizur Rahman"
                value={formData.father_name}
                onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm bg-white text-slate-900 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Mother's Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Nasima Akter"
                value={formData.mother_name}
                onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm bg-white text-slate-900 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Guardian Mobile (BD 11-digit) *
              </label>
              <input
                type="tel"
                required
                maxLength={11}
                placeholder="01712345678"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm font-mono bg-white text-slate-900 focus:border-indigo-600 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400">Used for SMS attendance & login</span>
            </div>
          </div>
        </div>

        {/* SECTION 5: Student User Account Portal */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Lock className="h-4 w-4 text-indigo-600" />
              Student Portal Credentials
            </h2>
            <p className="text-xs text-slate-500">
              An account with Student role is automatically generated. The student photo will be assigned as profile avatar.
            </p>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Initial Password
              </label>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm font-mono bg-white text-slate-800 focus:border-indigo-600 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400">Default: student123 (Student can change later)</span>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <Link
            to="/students"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 text-center transition-colors shadow-xs"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Enrolling & Uploading Media...</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Enroll Student</span>
              </>
            )}
          </button>
        </div>
      </form>
      )}
    </div>
  );
};
