<?php

namespace App\Modules\Exam\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Models\Student;
use App\Modules\Exam\Models\Exam;
use App\Modules\Exam\Models\ExamMark;
use App\Modules\Exam\Services\NctbGradingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExamMarkController extends Controller
{
    public function __construct(
        protected NctbGradingService $gradingService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = ExamMark::with(['student', 'subject', 'exam'])->forTenant();

        if ($request->filled('exam_id')) {
            $query->where('exam_id', $request->query('exam_id'));
        }

        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->query('subject_id'));
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->query('student_id'));
        }

        return response()->json($query->get());
    }

    /**
     * Rapid batch entry for examination marks.
     */
    public function bulkStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'exam_id' => 'required|exists:exams,id',
            'subject_id' => 'required|exists:subjects,id',
            'marks' => 'required|array',
            'marks.*.student_id' => 'required|exists:students,id',
            'marks.*.subjective_mark' => 'required|numeric|min:0|max:100',
            'marks.*.objective_mark' => 'required|numeric|min:0|max:100',
            'marks.*.practical_mark' => 'nullable|numeric|min:0|max:100',
            'marks.*.is_4th_subject' => 'nullable|boolean',
        ]);

        $examId = $validated['exam_id'];
        $subjectId = $validated['subject_id'];
        $schoolId = auth()->user()->school_id ?? 1;
        $academicYearId = (int) ($request->header('X-Academic-Year-Id') ?? 1);

        $savedMarks = [];

        DB::transaction(function () use ($validated, $examId, $subjectId, $schoolId, $academicYearId, &$savedMarks) {
            foreach ($validated['marks'] as $row) {
                $subMark = (float) $row['subjective_mark'];
                $objMark = (float) $row['objective_mark'];
                $pracMark = (float) ($row['practical_mark'] ?? 0);
                $totalMark = $subMark + $objMark + $pracMark;

                $gradeData = $this->gradingService->calculateSubjectGrade($totalMark);

                $mark = ExamMark::updateOrCreate(
                    [
                        'school_id' => $schoolId,
                        'academic_year_id' => $academicYearId,
                        'student_id' => $row['student_id'],
                        'exam_id' => $examId,
                        'subject_id' => $subjectId,
                    ],
                    [
                        'subjective_mark' => $subMark,
                        'objective_mark' => $objMark,
                        'practical_mark' => $pracMark,
                        'total_mark' => $totalMark,
                        'is_4th_subject' => (bool) ($row['is_4th_subject'] ?? false),
                        'gpa' => $gradeData['gpa'],
                        'grade' => $gradeData['grade'],
                    ]
                );

                $savedMarks[] = $mark;
            }
        });

        return response()->json([
            'message' => 'NCTB exam marks recorded successfully for ' . count($savedMarks) . ' students.',
            'count' => count($savedMarks),
        ], 201);
    }

    /**
     * Generate official NCTB Report Card / Tabulation result.
     */
    public function reportCard(int $studentId, int $examId): JsonResponse
    {
        $student = Student::with(['classLevel', 'section', 'school'])->findOrFail($studentId);
        $exam = Exam::findOrFail($examId);

        $marks = ExamMark::with('subject')
            ->where('student_id', $studentId)
            ->where('exam_id', $examId)
            ->get();

        $subjectGradesForGpa = $marks->map(function ($m) {
            return [
                'gpa' => (float) $m->gpa,
                'is_4th_subject' => (bool) $m->is_4th_subject,
            ];
        })->toArray();

        $finalEvaluation = $this->gradingService->calculateFinalGpa($subjectGradesForGpa);
        $totalMarksObtained = $marks->sum('total_mark');

        return response()->json([
            'student' => $student,
            'exam' => $exam,
            'marks' => $marks,
            'total_marks_obtained' => round($totalMarksObtained, 2),
            'final_gpa' => $finalEvaluation['final_gpa'],
            'final_grade' => $finalEvaluation['final_grade'],
            'passed' => $finalEvaluation['passed'],
            'has_failed_main_subject' => $finalEvaluation['has_failed_main_subject'],
            'fourth_subject_bonus' => $finalEvaluation['fourth_subject_bonus'],
            'total_grade_points' => $finalEvaluation['total_grade_points'],
        ]);
    }
}

