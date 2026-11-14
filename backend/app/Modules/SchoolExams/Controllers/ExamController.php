<?php

namespace App\Modules\SchoolExams\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\SchoolExams\Models\Exam;
use App\Modules\SchoolExams\Requests\StoreExamRequest;
use App\Modules\SchoolExams\Requests\UpdateExamRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    /**
     * List all exams for the current tenant school.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Exam::with(['academicYear'])
            ->withCount('marks')
            ->forTenant();

        if ($request->filled('term')) {
            $query->where('term', $request->query('term'));
        }

        if ($request->has('is_published')) {
            $query->where('is_published', filter_var($request->query('is_published'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('term', 'like', "%{$search}%");
            });
        }

        $exams = $query->orderBy('id', 'desc')->get();

        return response()->json($exams);
    }

    /**
     * Store a new exam belonging to the tenant school.
     */
    public function store(StoreExamRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $schoolId = auth()->user()?->school_id
            ?? ($request->header('X-School-Id') ? (int) $request->header('X-School-Id') : null)
            ?? School::first()?->id;

        $validated['school_id'] = $schoolId;

        if (empty($validated['academic_year_id'])) {
            $academicYearId = (int) $request->header('X-Academic-Year-Id');
            if (! $academicYearId) {
                $currentYear = AcademicYear::where('school_id', $schoolId)->where('is_current', true)->first()
                    ?? AcademicYear::where('school_id', $schoolId)->first();
                $academicYearId = $currentYear?->id ?? AcademicYear::first()?->id;
            }
            $validated['academic_year_id'] = $academicYearId;
        }

        $exam = Exam::create($validated);
        $exam->load(['academicYear']);
        $exam->loadCount('marks');

        return response()->json($exam, 201);
    }

    /**
     * Show details of a specific exam.
     */
    public function show(Exam $exam): JsonResponse
    {
        $this->authorizeTenant($exam);

        $exam->load(['academicYear']);
        $exam->loadCount('marks');

        return response()->json($exam);
    }

    /**
     * Update an exam.
     */
    public function update(UpdateExamRequest $request, Exam $exam): JsonResponse
    {
        $this->authorizeTenant($exam);

        $validated = $request->validated();
        $exam->update($validated);

        $exam->load(['academicYear']);
        $exam->loadCount('marks');

        return response()->json($exam);
    }

    /**
     * Delete an exam if no marks or student records are attached.
     */
    public function destroy(Exam $exam): JsonResponse
    {
        $this->authorizeTenant($exam);

        if ($exam->marks()->exists()) {
            return response()->json([
                'message' => "Cannot delete exam '{$exam->name}' because student exam marks have already been recorded. Remove or reset marks first.",
            ], 422);
        }

        $examName = $exam->name;
        $exam->delete();

        return response()->json([
            'message' => "Exam '{$examName}' deleted successfully.",
        ]);
    }

    /**
     * Toggle or set the publication status of an exam.
     */
    public function togglePublish(Request $request, Exam $exam): JsonResponse
    {
        $this->authorizeTenant($exam);

        if ($request->has('is_published')) {
            $exam->is_published = (bool) $request->boolean('is_published');
        } else {
            $exam->is_published = ! $exam->is_published;
        }

        $exam->save();

        return response()->json([
            'message' => $exam->is_published ? "Exam '{$exam->name}' results published." : "Exam '{$exam->name}' results un-published.",
            'is_published' => $exam->is_published,
            'exam' => $exam,
        ]);
    }

    /**
     * Check tenant ownership.
     */
    protected function authorizeTenant(Exam $exam): void
    {
        if (auth()->check() && auth()->user()->school_id && $exam->school_id !== auth()->user()->school_id) {
            abort(403, 'Unauthorized access to this school tenant.');
        }
    }
}

