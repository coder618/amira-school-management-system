import React, { useState } from 'react';
import { useStudents } from '../hooks/useStudents';
import { StudentModal } from './StudentModal';
import { ClassManagementModal } from './ClassManagementModal';
import { Student } from '../types';
import {
  Search,
  Plus,
  Trash2,
  Edit,
  Phone,
  GraduationCap,
  Users,
  Sun,
  Moon,
  Loader2,
  AlertCircle,
  Layers,
} from 'lucide-react';

export const StudentDataTable: React.FC = () => {
  const {
    students,
    classLevels,
    sections,
    shifts,
    loading,
    error,
    filters,
    setFilters,
    addStudent,
    updateStudent,
    removeStudent,
    addClassLevel,
    editClassLevel,
    removeClassLevel,
  } = useStudents();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this student record?')) {
      await removeStudent(id);
    }
  };

  const handleModalSubmit = async (formData: any) => {
    if (editingStudent) {
      await updateStudent(editingStudent.id, formData);
    } else {
      await addStudent(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-indigo-600" />
            Academic SIS Student Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Student Information System for Bangladeshi Primary & Secondary Schools
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsClassModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Layers className="h-4 w-4 text-indigo-600" />
            <span>Manage Classes</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Enroll New Student</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Query Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, student ID, roll, or 017... mobile..."
            value={filters.search || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden"
          />
        </div>

        <div>
          <select
            value={filters.class_level_id || ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                class_level_id: e.target.value ? parseInt(e.target.value) : undefined,
              }))
            }
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-700 focus:border-indigo-600 focus:bg-white focus:outline-hidden"
          >
            <option value="">All Class Levels</option>
            {classLevels.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filters.section_id || ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                section_id: e.target.value ? parseInt(e.target.value) : undefined,
              }))
            }
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-700 focus:border-indigo-600 focus:bg-white focus:outline-hidden"
          >
            <option value="">All Sections</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main SIS Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
            <span className="text-sm font-medium">Fetching academic SIS records from Laravel API...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-semibold text-slate-700">No student records match the query</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting the class or section filters, or enroll a new student.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Roll</th>
                  <th className="py-3 px-4">Student & ID</th>
                  <th className="py-3 px-4">Class & Section</th>
                  <th className="py-3 px-4">Shift</th>
                  <th className="py-3 px-4">Guardian & Mobile (BD)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Roll */}
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100">
                        {student.roll_number}
                      </span>
                    </td>

                    {/* Student Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {student.first_name} {student.last_name}
                      </div>
                      <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {student.student_id}
                      </span>
                    </td>

                    {/* Class & Section */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {student.class_level?.name || 'Class 10'}
                      </div>
                      <span className="text-xs text-slate-500">
                        Section: {student.section?.name || 'Padma'}
                      </span>
                    </td>

                    {/* Shift */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {student.shift?.name === 'Morning' ? (
                          <Sun className="h-3 w-3 text-amber-500" />
                        ) : (
                          <Moon className="h-3 w-3 text-indigo-500" />
                        )}
                        <span>{student.shift?.name || 'Day'}</span>
                      </span>
                    </td>

                    {/* Parents & Phone */}
                    <td className="py-3.5 px-4 text-xs space-y-0.5">
                      <div className="font-medium text-slate-800">
                        F: {student.father_name}
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 font-mono">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{student.phone_number}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize border ${
                          student.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(student)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Edit Student"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(student.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Student"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        classLevels={classLevels}
        sections={sections}
        shifts={shifts}
        initialData={editingStudent}
        onAddClass={addClassLevel}
        onUpdateClass={editClassLevel}
        onDeleteClass={removeClassLevel}
      />

      <ClassManagementModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        classLevels={classLevels}
        onAddClass={addClassLevel}
        onUpdateClass={editClassLevel}
        onDeleteClass={removeClassLevel}
      />
    </div>
  );
};

