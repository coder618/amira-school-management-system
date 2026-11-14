import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { academicApi } from '../features/academic/api';
import { ClassLevel, Section, Shift, Student } from '../features/academic/types';
import { isValidBdPhoneNumber } from '../shared/utils/validation';
import {
  Edit,
  ArrowLeft,
  X,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  GraduationCap,
  Phone,
  Save,
} from 'lucide-react';

export const EditStudentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Reference data
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    student_id: '',
    roll_number: 1,
    first_name: '',
    last_name: '',
    father_name: '',
    mother_name: '',
    phone_number: '017',
    email: '',
    gender: 'Male' as Student['gender'],
    status: 'active' as Student['status'],
    class_level_id: 0,
    section_id: 0,
    shift_id: 0,
    date_of_birth: '',
    address: '',
    enrollment_date: '',
  });

  // Current and new image files/previews
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

  // Load student & metadata
  useEffect(() => {
    const loadAll = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [studentData, classesData, sectionsData, shiftsData] = await Promise.all([
          academicApi.getStudentById(Number(id)),
          academicApi.getClassLevels(),
          academicApi.getSections(),
          academicApi.getShifts(),
        ]);

        setClassLevels(classesData);
        setSections(sectionsData);
        setShifts(shiftsData);

        setFormData({
          student_id: studentData.student_id,
          roll_number: studentData.roll_number,
          first_name: studentData.first_name,
          last_name: studentData.last_name || '',
          father_name: studentData.father_name,
          mother_name: studentData.mother_name,
          phone_number: studentData.phone_number,
          email: studentData.email || '',
          gender: studentData.gender,
          status: studentData.status,
          class_level_id: studentData.class_level_id,
          section_id: studentData.section_id,
          shift_id: studentData.shift_id || (shiftsData[0]?.id || 0),
          date_of_birth: studentData.date_of_birth || '',
          address: studentData.address || '',
          enrollment_date: studentData.enrollment_date || '',
        });

        if (studentData.student_image_url) {
          setStudentImagePreview(studentData.student_image_url);
        }
        if (studentData.parent_image_url) {
          setParentImagePreview(studentData.parent_image_url);
        }
        if (studentData.mother_image_url) {
          setMotherImagePreview(studentData.mother_image_url);
        }
      } catch (err) {
        setErrorMessage('Failed to load student details or class metadata.');
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [id]);

  const filteredSections = sections.filter(
    (sec) => !formData.class_level_id || sec.class_level_id === formData.class_level_id
  );

  // Image handlers
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
    setStudentImagePreview(null);
    if (studentImgInputRef.current) {
      studentImgInputRef.current.value = '';
    }
  };

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
    setParentImagePreview(null);
    if (parentImgInputRef.current) {
      parentImgInputRef.current.value = '';
    }
  };

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
    setMotherImagePreview(null);
    if (motherImgInputRef.current) {
      motherImgInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isValidBdPhoneNumber(formData.phone_number)) {
      setErrorMessage('Please enter a valid 11-digit Bangladeshi mobile number starting with 01[3-9] (e.g. 01712345678).');
      return;
    }

    if (!formData.class_level_id) {
      setErrorMessage('Please select a Class Level.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (studentImageFile || parentImageFile || motherImageFile) {
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
        if (formData.address) data.append('address', formData.address);
        if (formData.enrollment_date) data.append('enrollment_date', formData.enrollment_date);

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

        await academicApi.updateStudent(Number(id), data);
      } else {
        await academicApi.updateStudent(Number(id), formData);
      }

      setSuccessMessage('Student profile updated successfully!');
      setTimeout(() => {
        navigate(`/students/${id}`);
      }, 1200);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const ax = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        const msg = ax.response?.data?.message;
        const errors = ax.response?.data?.errors;
        if (errors) {
          setErrorMessage(Object.values(errors).flat().join(' '));
        } else {
          setErrorMessage(msg || 'Failed to update student.');
        }
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="text-sm font-medium">Loading student details for editing...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4 px-2 sm:px-4 space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/students/${id}`}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors shadow-xs"
            title="Back to Student Profile"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Edit className="h-7 w-7 text-indigo-600" />
              Edit Student Profile
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Update academic records, personal information, and uploaded photos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/students/${id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Users className="h-4 w-4 text-indigo-600" />
            <span>View Profile</span>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 animate-in fade-in">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Update Error: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMessage} Redirecting to profile...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photos & Media Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Camera className="h-4 w-4 text-indigo-600" />
                Student & Parent Photos
              </h2>
              <p className="text-xs text-slate-500">
                Update or replace student ID and parent photos stored in tenant media
              </p>
            </div>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
              Media Module Scoped
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Student Photo */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
                Student Photo
              </span>
              <div className="relative mb-3">
                {studentImagePreview ? (
                  <div className="relative group">
                    <img
                      src={studentImagePreview}
                      alt="Student"
                      className="w-28 h-28 object-cover rounded-2xl border-2 border-indigo-500 shadow-md bg-white"
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
                accept="image/*"
                className="hidden"
                onChange={handleStudentImageChange}
              />
              <button
                type="button"
                onClick={() => studentImgInputRef.current?.click()}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                {studentImagePreview ? 'Change Student Photo' : 'Upload Student Photo'}
              </button>
            </div>

            {/* Father / Parent Photo */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
                Father / Guardian Photo
              </span>
              <div className="relative mb-3">
                {parentImagePreview ? (
                  <div className="relative group">
                    <img
                      src={parentImagePreview}
                      alt="Father"
                      className="w-28 h-28 object-cover rounded-2xl border-2 border-indigo-500 shadow-md bg-white"
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
                accept="image/*"
                className="hidden"
                onChange={handleParentImageChange}
              />
              <button
                type="button"
                onClick={() => parentImgInputRef.current?.click()}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                {parentImagePreview ? 'Change Father Photo' : 'Upload Father Photo'}
              </button>
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
                      alt="Mother"
                      className="w-28 h-28 object-cover rounded-2xl border-2 border-indigo-500 shadow-md bg-white"
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
                accept="image/*"
                className="hidden"
                onChange={handleMotherImageChange}
              />
              <button
                type="button"
                onClick={() => motherImgInputRef.current?.click()}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                {motherImagePreview ? 'Change Mother Photo' : 'Upload Mother Photo'}
              </button>
            </div>
          </div>
        </div>

        {/* Academic Placement Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-indigo-600" />
              Academic Placement
            </h2>
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
                {filteredSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
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
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Shift
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
          </div>
        </div>

        {/* Personal Details Card */}
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
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm bg-white text-slate-800 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Residential Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm bg-white text-slate-800 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Parents Card */}
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
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm font-mono bg-white text-slate-900 focus:border-indigo-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <Link
            to={`/students/${id}`}
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
