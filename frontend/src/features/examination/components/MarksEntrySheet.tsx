import React, { useState } from 'react';
import { useExamination } from '../hooks/useExamination';
import { ReportCardModal } from './ReportCardModal';
import {
  Award,
  Save,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  Users,
} from 'lucide-react';

export const MarksEntrySheet: React.FC = () => {
  const {
    exams,
    classLevels,
    subjects,
    selectedExamId,
    setSelectedExamId,
    selectedClassId,
    setSelectedClassId,
    selectedSubjectId,
    setSelectedSubjectId,
    rows,
    loading,
    saving,
    feedback,
    activeReportCard,
    setActiveReportCard,
    updateStudentMark,
    saveMarks,
    viewReportCard,
  } = useExamination();

  const [is4thSubjectSubject, setIs4thSubjectSubject] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Award className="h-7 w-7 text-indigo-600" />
            NCTB Examination & Grading
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Standard Bangladesh grading scale (A+ to F), 4th subject bonus, and automated tabulation
          </p>
        </div>

        <button
          type="button"
          onClick={saveMarks}
          disabled={saving || loading || rows.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save Marks to Database</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl p-4 text-sm border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs items-center">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            Exam Session
          </label>
          <select
            value={selectedExamId || ''}
            onChange={(e) => setSelectedExamId(parseInt(e.target.value))}
            className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.term})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            Class Level
          </label>
          <select
            value={selectedClassId || ''}
            onChange={(e) => setSelectedClassId(parseInt(e.target.value))}
            className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
          >
            {classLevels.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            Subject
          </label>
          <select
            value={selectedSubjectId || ''}
            onChange={(e) => {
              const subId = parseInt(e.target.value);
              setSelectedSubjectId(subId);
              const sub = subjects.find((s) => s.id === subId);
              setIs4thSubjectSubject(Boolean(sub?.can_be_4th_subject));
            }}
            className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-sm focus:border-indigo-600 focus:outline-hidden"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.code ? `(${s.code})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-3 sm:pt-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={is4thSubjectSubject}
              onChange={(e) => {
                const val = e.target.checked;
                setIs4thSubjectSubject(val);
                rows.forEach((r) => updateStudentMark(r.student.id, 'is_4th_subject', val));
              }}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-bold text-indigo-900">
              Apply 4th Subject Rule (-2.00 GPA deduction)
            </span>
          </label>
        </div>
      </div>

      {/* Marks Sheet Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
            <span className="text-sm font-medium">Fetching examination tabulation list...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-semibold text-slate-700">No students found in this class</p>
            <p className="text-xs text-slate-400 mt-1">Please select another class level or subject.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Roll</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-3 text-center">Creative (CQ)</th>
                  <th className="py-3 px-3 text-center">Objective (MCQ)</th>
                  <th className="py-3 px-3 text-center">Practical</th>
                  <th className="py-3 px-3 text-center">Total Mark</th>
                  <th className="py-3 px-3 text-center">NCTB Grade</th>
                  <th className="py-3 px-3 text-center">GPA</th>
                  <th className="py-3 px-4 text-right">Report Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.student.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      #{row.student.roll_number}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {row.student.first_name} {row.student.last_name}
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {row.student.student_id}
                      </span>
                    </td>

                    {/* CQ Input */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={row.subjective_mark}
                        onChange={(e) =>
                          updateStudentMark(
                            row.student.id,
                            'subjective_mark',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-18 text-center rounded-lg border border-slate-300 py-1 px-2 text-xs font-mono font-bold focus:border-indigo-600 focus:outline-hidden"
                      />
                    </td>

                    {/* MCQ Input */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={row.objective_mark}
                        onChange={(e) =>
                          updateStudentMark(
                            row.student.id,
                            'objective_mark',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-18 text-center rounded-lg border border-slate-300 py-1 px-2 text-xs font-mono font-bold focus:border-indigo-600 focus:outline-hidden"
                      />
                    </td>

                    {/* Practical Input */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={row.practical_mark}
                        onChange={(e) =>
                          updateStudentMark(
                            row.student.id,
                            'practical_mark',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-18 text-center rounded-lg border border-slate-300 py-1 px-2 text-xs font-mono font-bold focus:border-indigo-600 focus:outline-hidden"
                      />
                    </td>

                    {/* Calculated Total */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 text-sm">
                      {row.total_mark}
                    </td>

                    {/* Grade Pill */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block font-extrabold px-2.5 py-0.5 rounded text-xs ${
                          row.grade === 'A+'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : row.grade === 'F'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        }`}
                      >
                        {row.grade}
                      </span>
                    </td>

                    {/* Subject GPA */}
                    <td className="py-3 px-3 text-center font-mono font-extrabold text-slate-900">
                      {row.gpa.toFixed(2)}
                    </td>

                    {/* View Report Card */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => viewReportCard(row.student.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Transcript</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transcript Modal */}
      <ReportCardModal
        reportCard={activeReportCard}
        onClose={() => setActiveReportCard(null)}
      />
    </div>
  );
};

