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
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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

        $mark = $validated['mark'] ?? $validated['total_mark'] ?? null;
        if ($mark !== null) {
            $totalMark = (float) $mark;
            $subMark = (float) $mark;
            $objMark = 0.0;
            $pracMark = 0.0;
        } else {
            $subMark = (float) ($validated['subjective_mark'] ?? 0);
            $objMark = (float) ($validated['objective_mark'] ?? 0);
            $pracMark = (float) ($validated['practical_mark'] ?? 0);
            $totalMark = $subMark + $objMark + $pracMark;
        }

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
                'note' => $validated['note'] ?? null,
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

        $mark = $validated['mark'] ?? $validated['total_mark'] ?? null;
        if ($mark !== null) {
            $totalMark = (float) $mark;
            $subMark = (float) $mark;
            $objMark = 0.0;
            $pracMark = 0.0;
        } else {
            $subMark = isset($validated['subjective_mark']) ? (float) $validated['subjective_mark'] : (float) $examResult->subjective_mark;
            $objMark = isset($validated['objective_mark']) ? (float) $validated['objective_mark'] : (float) $examResult->objective_mark;
            $pracMark = array_key_exists('practical_mark', $validated) ? (float) $validated['practical_mark'] : (float) $examResult->practical_mark;
            $totalMark = $subMark + $objMark + $pracMark;
        }

        $gradeData = $this->gradingService->calculateSubjectGrade($totalMark);

        $updateData = [
            'subjective_mark' => $subMark,
            'objective_mark' => $objMark,
            'practical_mark' => $pracMark,
            'total_mark' => $totalMark,
            'is_4th_subject' => array_key_exists('is_4th_subject', $validated) ? (bool) $validated['is_4th_subject'] : $examResult->is_4th_subject,
            'gpa' => $gradeData['gpa'],
            'grade' => $gradeData['grade'],
        ];

        if (array_key_exists('note', $validated)) {
            $updateData['note'] = $validated['note'];
        }

        $examResult->update($updateData);

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
            'message' => 'NCTB exam marks recorded successfully for '.count($savedResults).' students.',
            'count' => count($savedResults),
        ], 201);
    }

    /**
     * Store or update a full composite result for a student in an exam across multiple subjects.
     */
    public function saveStudentResult(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'exam_id' => 'required|exists:exams,id',
            'marks' => 'required|array',
            'marks.*.subject_id' => 'required|exists:subjects,id',
            'marks.*.mark' => 'nullable|numeric|min:0|max:100',
            'marks.*.total_mark' => 'nullable|numeric|min:0|max:100',
            'marks.*.subjective_mark' => 'nullable|numeric|min:0|max:100',
            'marks.*.objective_mark' => 'nullable|numeric|min:0|max:100',
            'marks.*.practical_mark' => 'nullable|numeric|min:0|max:100',
            'marks.*.is_4th_subject' => 'nullable|boolean',
            'marks.*.note' => 'nullable|string|max:1000',
        ]);

        $studentId = (int) $validated['student_id'];
        $examId = (int) $validated['exam_id'];

        $student = Student::findOrFail($studentId);
        $exam = Exam::findOrFail($examId);

        $schoolId = auth()->user()?->school_id
            ?? ($request->header('X-School-Id') ? (int) $request->header('X-School-Id') : null)
            ?? $student->school_id;

        $academicYearId = (int) $request->header('X-Academic-Year-Id');
        if (! $academicYearId && $schoolId) {
            $currentYear = AcademicYear::where('school_id', $schoolId)->where('is_current', true)->first()
                ?? AcademicYear::where('school_id', $schoolId)->first();
            $academicYearId = $currentYear?->id ?? AcademicYear::first()?->id;
        }

        DB::transaction(function () use ($validated, $studentId, $examId, $schoolId, $academicYearId) {
            foreach ($validated['marks'] as $row) {
                if (isset($row['mark']) || isset($row['total_mark'])) {
                    $totalMark = (float) ($row['mark'] ?? $row['total_mark']);
                    $subMark = $totalMark;
                    $objMark = 0.0;
                    $pracMark = 0.0;
                } else {
                    $subMark = (float) ($row['subjective_mark'] ?? 0);
                    $objMark = (float) ($row['objective_mark'] ?? 0);
                    $pracMark = (float) ($row['practical_mark'] ?? 0);
                    $totalMark = $subMark + $objMark + $pracMark;
                }

                $gradeData = $this->gradingService->calculateSubjectGrade($totalMark);

                ExamResult::updateOrCreate(
                    [
                        'school_id' => $schoolId,
                        'academic_year_id' => $academicYearId,
                        'student_id' => $studentId,
                        'exam_id' => $examId,
                        'subject_id' => $row['subject_id'],
                    ],
                    [
                        'subjective_mark' => $subMark,
                        'objective_mark' => $objMark,
                        'practical_mark' => $pracMark,
                        'total_mark' => $totalMark,
                        'is_4th_subject' => (bool) ($row['is_4th_subject'] ?? false),
                        'gpa' => $gradeData['gpa'],
                        'grade' => $gradeData['grade'],
                        'note' => $row['note'] ?? null,
                    ]
                );
            }
        });

        return $this->reportCard($request, $studentId, $examId);
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
     * Generate and download professional PDF Result Slip / Academic Transcript for a student.
     */
    public function downloadPdf(Request $request, int $studentId, int $examId): Response
    {
        $student = Student::with(['classLevel', 'section', 'shift', 'school'])->findOrFail($studentId);
        $exam = Exam::with('academicYear')->findOrFail($examId);

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

        // Determine student merit position / rank if classLevel is available
        $rank = null;
        if ($student->class_level_id) {
            $classStudents = Student::where('class_level_id', $student->class_level_id)
                ->forTenant()
                ->pluck('id');

            $allClassMarks = ExamResult::where('exam_id', $examId)
                ->whereIn('student_id', $classStudents)
                ->get()
                ->groupBy('student_id');

            $studentScores = [];
            foreach ($classStudents as $cStudentId) {
                $cMarks = $allClassMarks->get($cStudentId, collect());
                $cGrades = $cMarks->map(fn ($m) => [
                    'gpa' => (float) $m->gpa,
                    'is_4th_subject' => (bool) $m->is_4th_subject,
                ])->toArray();
                $cEval = $this->gradingService->calculateFinalGpa($cGrades);
                $studentScores[] = [
                    'student_id' => $cStudentId,
                    'passed' => $cEval['passed'],
                    'final_gpa' => $cEval['final_gpa'],
                    'total_marks' => $cMarks->sum('total_mark'),
                ];
            }

            usort($studentScores, function ($a, $b) {
                if ($a['passed'] !== $b['passed']) {
                    return $b['passed'] <=> $a['passed'];
                }
                if ($a['final_gpa'] !== $b['final_gpa']) {
                    return $b['final_gpa'] <=> $a['final_gpa'];
                }

                return $b['total_marks'] <=> $a['total_marks'];
            });

            foreach ($studentScores as $index => $row) {
                if ($row['student_id'] === $student->id) {
                    $rank = $index + 1;
                    break;
                }
            }
        }

        // Get school with proper institutional details (updated via Settings)
        $school = $student->school
            ?? School::find($student->school_id)
            ?? School::find(auth()->user()?->school_id)
            ?? School::first();

        $pdf = Pdf::loadView('pdf.result_slip', [
            'school' => $school,
            'student' => $student,
            'exam' => $exam,
            'marks' => $marks,
            'totalMarksObtained' => round($totalMarksObtained, 2),
            'finalGpa' => $finalEvaluation['final_gpa'],
            'finalGrade' => $finalEvaluation['final_grade'],
            'passed' => $finalEvaluation['passed'],
            'hasFailedMainSubject' => $finalEvaluation['has_failed_main_subject'],
            'fourthSubjectBonus' => $finalEvaluation['fourth_subject_bonus'],
            'totalGradePoints' => $finalEvaluation['total_grade_points'],
            'rank' => $rank,
        ])->setPaper('a4', 'portrait');

        $safeName = Str::slug($student->first_name.' '.$student->last_name);
        $fileName = "Result-Slip-{$safeName}-Roll-{$student->roll_number}.pdf";

        return $pdf->download($fileName);
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
                'name' => $student->first_name.' '.$student->last_name,
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
