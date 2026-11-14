<?php

namespace App\Modules\SchoolExamResults\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Models\ClassLevel;
use App\Modules\Academic\Models\Student;
use App\Modules\Academic\Models\Subject;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\SchoolExamResults\Models\ExamResult;
use App\Modules\SchoolExamResults\Requests\BulkStoreExamResultRequest;
use App\Modules\SchoolExamResults\Requests\StoreExamResultRequest;
use App\Modules\SchoolExamResults\Requests\UpdateExamResultRequest;
use App\Modules\SchoolExamResults\Services\NctbGradingService;
use App\Modules\SchoolExams\Models\Exam;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExamResultController extends Controller
{
    public function __construct(
        protected NctbGradingService $gradingService
    ) {}

    /**
     * List exam results filtered by exam, subject, or student. Scoped to tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ExamResult::with(['student.classLevel', 'student.section', 'subject', 'exam'])
            ->forTenant();

        if ($request->filled('exam_id')) {
            $query->where('exam_id', $request->query('exam_id'));
        }

        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->query('subject_id'));
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->query('student_id'));
        }

        if ($request->filled('class_level_id')) {
            $classLevelId = $request->query('class_level_id');
            $query->whereHas('student', function ($q) use ($classLevelId) {
                $q->where('class_level_id', $classLevelId);
            });
        }

        if ($request->filled('section_id')) {
            $sectionId = $request->query('section_id');
            $query->whereHas('student', function ($q) use ($sectionId) {
                $q->where('section_id', $sectionId);
            });
        }

        $results = $query->orderBy('id', 'desc')->get();

        return response()->json($results);
    }

    /**
     * Store or update an individual student's exam mark.
     */
    public function store(StoreExamResultRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $schoolId = auth()->user()?->school_id
            ?? ($request->header('X-School-Id') ? (int) $request->header('X-School-Id') : null)
            ?? School::first()?->id;

        $academicYearId = (int) $request->header('X-Academic-Year-Id');
        if (! $academicYearId && $schoolId) {
            $currentYear = AcademicYear::where('school_id', $schoolId)->where('is_current', true)->first()
                ?? AcademicYear::where('school_id', $schoolId)->first();
            $academicYearId = $currentYear?->id ?? AcademicYear::first()?->id;
        }

        $subMark = (float) $validated['subjective_mark'];
        $objMark = (float) $validated['objective_mark'];
        $pracMark = (float) ($validated['practical_mark'] ?? 0);
        $totalMark = $subMark + $objMark + $pracMark;

        $gradeData = $this->gradingService->calculateSubjectGrade($totalMark);

        $result = ExamResult::updateOrCreate(
            [
                'school_id' => $schoolId,
                'academic_year_id' => $academicYearId,
                'student_id' => $validated['student_id'],
                'exam_id' => $validated['exam_id'],
                'subject_id' => $validated['subject_id'],
            ],
            [
                'subjective_mark' => $subMark,
                'objective_mark' => $objMark,
                'practical_mark' => $pracMark,
                'total_mark' => $totalMark,
                'is_4th_subject' => (bool) ($validated['is_4th_subject'] ?? false),
                'gpa' => $gradeData['gpa'],
                'grade' => $gradeData['grade'],
            ]
        );

        $result->load(['student', 'subject', 'exam']);

        return response()->json($result, 201);
    }

    /**
     * Show a specific exam result.
     */
    public function show(ExamResult $examResult): JsonResponse
    {
        $this->authorizeTenant($examResult);

        $examResult->load(['student.classLevel', 'student.section', 'subject', 'exam']);

        return response()->json($examResult);
    }

    /**
     * Update an existing exam result.
     */
    public function update(UpdateExamResultRequest $request, ExamResult $examResult): JsonResponse
    {
        $this->authorizeTenant($examResult);

        $validated = $request->validated();

        $subMark = isset($validated['subjective_mark']) ? (float) $validated['subjective_mark'] : (float) $examResult->subjective_mark;
        $objMark = isset($validated['objective_mark']) ? (float) $validated['objective_mark'] : (float) $examResult->objective_mark;
        $pracMark = array_key_exists('practical_mark', $validated) ? (float) $validated['practical_mark'] : (float) $examResult->practical_mark;
        $totalMark = $subMark + $objMark + $pracMark;

        $gradeData = $this->gradingService->calculateSubjectGrade($totalMark);

        $examResult->update([
            'subjective_mark' => $subMark,
            'objective_mark' => $objMark,
            'practical_mark' => $pracMark,
            'total_mark' => $totalMark,
            'is_4th_subject' => array_key_exists('is_4th_subject', $validated) ? (bool) $validated['is_4th_subject'] : $examResult->is_4th_subject,
            'gpa' => $gradeData['gpa'],
            'grade' => $gradeData['grade'],
        ]);

        $examResult->load(['student', 'subject', 'exam']);

        return response()->json($examResult);
    }

    /**
     * Delete an exam result record.
     */
    public function destroy(ExamResult $examResult): JsonResponse
    {
        $this->authorizeTenant($examResult);

        $examResult->delete();

        return response()->json([
            'message' => 'Exam result deleted successfully.',
        ]);
    }

    /**
     * Rapid batch entry for examination marks in a section/subject.
     */
    public function bulkStore(BulkStoreExamResultRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $examId = $validated['exam_id'];
        $subjectId = $validated['subject_id'];

        $schoolId = auth()->user()?->school_id
            ?? ($request->header('X-School-Id') ? (int) $request->header('X-School-Id') : null)
            ?? School::first()?->id;

        $academicYearId = (int) $request->header('X-Academic-Year-Id');
        if (! $academicYearId && $schoolId) {
            $currentYear = AcademicYear::where('school_id', $schoolId)->where('is_current', true)->first()
                ?? AcademicYear::where('school_id', $schoolId)->first();
            $academicYearId = $currentYear?->id ?? AcademicYear::first()?->id;
        }

        $savedResults = [];

        DB::transaction(function () use ($validated, $examId, $subjectId, $schoolId, $academicYearId, &$savedResults) {
            foreach ($validated['marks'] as $row) {
                $subMark = (float) $row['subjective_mark'];
                $objMark = (float) $row['objective_mark'];
                $pracMark = (float) ($row['practical_mark'] ?? 0);
                $totalMark = $subMark + $objMark + $pracMark;

                $gradeData = $this->gradingService->calculateSubjectGrade($totalMark);

                $result = ExamResult::updateOrCreate(
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

                $savedResults[] = $result;
            }
        });

        return response()->json([
            'message' => 'NCTB exam marks recorded successfully for ' . count($savedResults) . ' students.',
            'count' => count($savedResults),
        ], 201);
    }

    /**
     * Generate official NCTB Report Card / Tabulation result for a student in an exam.
     */
    public function reportCard(Request $request, int $studentId, int $examId): JsonResponse
    {
        $student = Student::with(['classLevel', 'section', 'shift', 'school'])->findOrFail($studentId);
        $exam = Exam::findOrFail($examId);

        // Multi-tenant security check
        if (auth()->check() && auth()->user()->school_id) {
            if ($student->school_id !== auth()->user()->school_id || $exam->school_id !== auth()->user()->school_id) {
                abort(403, 'Unauthorized access to this school tenant.');
            }
        }

        $marks = ExamResult::with('subject')
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

    /**
     * Generate complete class tabulation sheet with merit positions (ranks).
     */
    public function tabulationSheet(Request $request, int $examId, int $classLevelId): JsonResponse
    {
        $classLevel = ClassLevel::findOrFail($classLevelId);
        $exam = Exam::findOrFail($examId);

        if (auth()->check() && auth()->user()->school_id) {
            if ($classLevel->school_id !== auth()->user()->school_id || $exam->school_id !== auth()->user()->school_id) {
                abort(403, 'Unauthorized access to this school tenant.');
            }
        }

        $students = Student::where('class_level_id', $classLevelId)
            ->forTenant()
            ->with(['section'])
            ->orderBy('roll_number', 'asc')
            ->get();

        $subjects = Subject::where('class_level_id', $classLevelId)
            ->forTenant()
            ->orderBy('id', 'asc')
            ->get();

        $allMarks = ExamResult::where('exam_id', $examId)
            ->whereIn('student_id', $students->pluck('id'))
            ->get()
            ->groupBy('student_id');

        $tabulationRows = [];

        foreach ($students as $student) {
            $studentMarks = $allMarks->get($student->id, collect());
            $subjectMarksMap = [];

            foreach ($subjects as $subject) {
                $markRecord = $studentMarks->firstWhere('subject_id', $subject->id);
                $subjectMarksMap[$subject->id] = $markRecord ? [
                    'subjective' => (float) $markRecord->subjective_mark,
                    'objective' => (float) $markRecord->objective_mark,
                    'practical' => (float) $markRecord->practical_mark,
                    'total' => (float) $markRecord->total_mark,
                    'gpa' => (float) $markRecord->gpa,
                    'grade' => $markRecord->grade,
                    'is_4th' => (bool) $markRecord->is_4th_subject,
                ] : null;
            }

            $subjectGrades = $studentMarks->map(fn ($m) => [
                'gpa' => (float) $m->gpa,
                'is_4th_subject' => (bool) $m->is_4th_subject,
            ])->toArray();

            $evaluation = $this->gradingService->calculateFinalGpa($subjectGrades);
            $totalMarksSum = $studentMarks->sum('total_mark');

            $tabulationRows[] = [
                'student_id' => $student->id,
                'student_code' => $student->student_id,
                'roll_number' => $student->roll_number,
                'name' => $student->first_name . ' ' . $student->last_name,
                'section' => $student->section?->name,
                'subjects' => $subjectMarksMap,
                'total_marks' => round($totalMarksSum, 2),
                'final_gpa' => $evaluation['final_gpa'],
                'final_grade' => $evaluation['final_grade'],
                'passed' => $evaluation['passed'],
            ];
        }

        // Assign merit position (rank) sorted by passed desc, final_gpa desc, total_marks desc
        usort($tabulationRows, function ($a, $b) {
            if ($a['passed'] !== $b['passed']) {
                return $b['passed'] <=> $a['passed'];
            }
            if ($a['final_gpa'] != $b['final_gpa']) {
                return $b['final_gpa'] <=> $a['final_gpa'];
            }
            return $b['total_marks'] <=> $a['total_marks'];
        });

        $rank = 1;
        foreach ($tabulationRows as &$row) {
            $row['rank'] = $row['passed'] ? $rank++ : null;
        }

        return response()->json([
            'exam' => $exam,
            'class_level' => $classLevel,
            'subjects' => $subjects,
            'tabulation' => $tabulationRows,
        ]);
    }

    /**
     * Check tenant ownership.
     */
    protected function authorizeTenant(ExamResult $examResult): void
    {
        if (auth()->check() && auth()->user()->school_id && $examResult->school_id !== auth()->user()->school_id) {
            abort(403, 'Unauthorized access to this school tenant.');
        }
    }
}

