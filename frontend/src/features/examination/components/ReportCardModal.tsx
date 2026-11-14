import React from 'react';
import { StudentReportCard } from '../types';
import { X, Award, CheckCircle, XCircle, Printer } from 'lucide-react';

interface ReportCardModalProps {
  reportCard: StudentReportCard | null;
  onClose: () => void;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({ reportCard, onClose }) => {
  if (!reportCard) return null;

  const {
    student,
    exam,
    marks,
    total_marks_obtained,
    final_gpa,
    final_grade,
    passed,
    has_failed_main_subject,
    fourth_subject_bonus,
  } = reportCard;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3.5 bg-slate-50">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600" />
            <span className="text-sm font-bold text-slate-800">
              National Curriculum and Textbook Board (NCTB) Academic Transcript
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Print Transcript"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Institution Header */}
          <div className="text-center pb-4 border-b border-slate-200">
            <h2 className="text-xl font-extrabold text-slate-900">
              {student.school?.name || 'Dhaka Ideal High School & College'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              EIIN: {student.school?.eiin || '108250'} | Education Board: {student.school?.board || 'Dhaka'}
            </p>
            <span className="mt-2 inline-block rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-900">
              {exam.name} - Tabulation Sheet
            </span>
          </div>

          {/* Student Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold uppercase">Student Name</span>
              <span className="font-bold text-slate-900">{student.first_name} {student.last_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold uppercase">Student ID</span>
              <span className="font-mono font-bold text-slate-900">{student.student_id}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold uppercase">Class & Section</span>
              <span className="font-bold text-slate-900">
                {student.class_level?.name} ({student.section?.name})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold uppercase">Class Roll</span>
              <span className="font-mono font-bold text-indigo-700">#{student.roll_number}</span>
            </div>
          </div>

          {/* Subject Breakdown Table */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-2 text-center">CQ</th>
                  <th className="py-2.5 px-2 text-center">MCQ</th>
                  <th className="py-2.5 px-2 text-center">Prac</th>
                  <th className="py-2.5 px-2 text-center font-bold">Total</th>
                  <th className="py-2.5 px-2 text-center">Grade</th>
                  <th className="py-2.5 px-3 text-right">GPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {marks.map((m) => (
                  <tr
                    key={m.id}
                    className={m.is_4th_subject ? 'bg-indigo-50/40' : 'hover:bg-slate-50'}
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">
                        {m.subject?.name}
                      </div>
                      {m.is_4th_subject && (
                        <span className="text-[10px] font-bold text-indigo-600 block">
                          ★ 4th Subject (NCTB Rule applied)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono">{m.subjective_mark}</td>
                    <td className="py-2.5 px-2 text-center font-mono">{m.objective_mark}</td>
                    <td className="py-2.5 px-2 text-center font-mono">{m.practical_mark || '0'}</td>
                    <td className="py-2.5 px-2 text-center font-bold font-mono text-slate-900">
                      {m.total_mark}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] ${
                          m.grade === 'A+'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.grade === 'F'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {m.grade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {Number(m.gpa).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Final Composite Result Card */}
          <div
            className={`rounded-2xl p-5 border text-center ${
              passed
                ? 'bg-linear-to-r from-emerald-500/10 via-emerald-500/5 to-indigo-500/10 border-emerald-300'
                : 'bg-rose-50 border-rose-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left">
                <div className="flex items-center gap-2">
                  {passed ? (
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-rose-600" />
                  )}
                  <span className="text-base font-extrabold text-slate-900">
                    {passed ? 'PROMOTED / PASSED' : 'FAILED'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {has_failed_main_subject
                    ? 'Failed one or more mandatory main subjects.'
                    : `4th Subject Bonus Points: +${Number(fourth_subject_bonus).toFixed(2)} pts (NCTB standard)`}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                    Total Marks
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-800">
                    {total_marks_obtained}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                    Final Grade
                  </span>
                  <span className="text-2xl font-black text-indigo-700">
                    {final_grade}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                    Composite GPA
                  </span>
                  <span className="text-2xl font-black font-mono text-emerald-600">
                    {Number(final_gpa).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

