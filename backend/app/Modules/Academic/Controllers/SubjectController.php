<?php

namespace App\Modules\Academic\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Models\ClassLevel;
use App\Modules\Academic\Models\Subject;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SubjectController extends Controller
{
    /**
     * List all subjects for tenant, with optional class_level_id and search filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Subject::with('classLevel')
            ->withCount('results')
            ->forTenant();

        if ($request->filled('class_level_id')) {
            $query->where('class_level_id', $request->query('class_level_id'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_optional')) {
            $query->where('is_optional', filter_var($request->query('is_optional'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('can_be_4th_subject')) {
            $query->where('can_be_4th_subject', filter_var($request->query('can_be_4th_subject'), FILTER_VALIDATE_BOOLEAN));
        }

        $subjects = $query->orderBy('class_level_id', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        return response()->json($subjects);
    }

    /**
     * Store a new subject belonging to a specific class level in tenant school.
     */
    public function store(Request $request): JsonResponse
    {
        $schoolId = auth()->user()?->school_id
            ?? ($request->header('X-School-Id') ? (int) $request->header('X-School-Id') : null)
            ?? School::first()?->id;

        $academicYearId = (int) $request->header('X-Academic-Year-Id');
        if (! $academicYearId && $schoolId) {
            $currentYear = AcademicYear::where('school_id', $schoolId)->where('is_current', true)->first()
                ?? AcademicYear::where('school_id', $schoolId)->first();
            $academicYearId = $currentYear?->id ?? AcademicYear::first()?->id;
        }

        $validated = $request->validate([
            'class_level_id' => [
                'required',
                Rule::exists('class_levels', 'id')->where(function ($query) use ($schoolId) {
                    if ($schoolId) {
                        $query->where('school_id', $schoolId);
                    }
                    return $query;
                }),
            ],
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('subjects', 'name')->where(function ($query) use ($schoolId, $academicYearId, $request) {
                    $q = $query->where('school_id', $schoolId)
                        ->where('class_level_id', $request->input('class_level_id'));
                    if ($academicYearId) {
                        $q->where('academic_year_id', $academicYearId);
                    }
                    return $q;
                }),
            ],
            'code' => 'nullable|string|max:20',
            'full_mark' => 'nullable|numeric|min:1|max:500',
            'pass_mark' => 'nullable|numeric|min:0|max:500',
            'is_optional' => 'nullable|boolean',
            'can_be_4th_subject' => 'nullable|boolean',
        ], [
            'name.unique' => 'A subject with this name already exists for the selected class in this academic session.',
        ]);

        $validated['school_id'] = $schoolId;
        if ($academicYearId) {
            $validated['academic_year_id'] = $academicYearId;
        }
        $validated['full_mark'] = $validated['full_mark'] ?? 100.00;
        $validated['pass_mark'] = $validated['pass_mark'] ?? 33.00;
        $validated['is_optional'] = (bool) ($validated['is_optional'] ?? false);
        $validated['can_be_4th_subject'] = (bool) ($validated['can_be_4th_subject'] ?? false);

        $subject = Subject::create($validated);
        $subject->load('classLevel');
        $subject->loadCount('results');

        return response()->json($subject, 201);
    }

    /**
     * Show a specific subject.
     */
    public function show(Subject $subject): JsonResponse
    {
        $this->authorizeTenant($subject);
        $subject->load('classLevel');
        $subject->loadCount('results');

        return response()->json($subject);
    }

    /**
     * Update an existing subject.
     */
    public function update(Request $request, Subject $subject): JsonResponse
    {
        $this->authorizeTenant($subject);

        $schoolId = $subject->school_id;
        $academicYearId = $subject->academic_year_id;

        $validated = $request->validate([
            'class_level_id' => [
                'sometimes',
                'required',
                Rule::exists('class_levels', 'id')->where(function ($query) use ($schoolId) {
                    if ($schoolId) {
                        $query->where('school_id', $schoolId);
                    }
                    return $query;
                }),
            ],
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('subjects', 'name')
                    ->where(function ($query) use ($schoolId, $academicYearId, $request, $subject) {
                        $classId = $request->input('class_level_id', $subject->class_level_id);
                        $q = $query->where('school_id', $schoolId)
                            ->where('class_level_id', $classId);
                        if ($academicYearId) {
                            $q->where('academic_year_id', $academicYearId);
                        }
                        return $q;
                    })
                    ->ignore($subject->id),
            ],
            'code' => 'nullable|string|max:20',
            'full_mark' => 'sometimes|numeric|min:1|max:500',
            'pass_mark' => 'sometimes|numeric|min:0|max:500',
            'is_optional' => 'nullable|boolean',
            'can_be_4th_subject' => 'nullable|boolean',
        ], [
            'name.unique' => 'A subject with this name already exists for the selected class.',
        ]);

        $subject->update($validated);
        $subject->load('classLevel');
        $subject->loadCount('results');

        return response()->json($subject);
    }

    /**
     * Delete a subject if no exam marks/results are attached.
     */
    public function destroy(Subject $subject): JsonResponse
    {
        $this->authorizeTenant($subject);

        if ($subject->results()->exists()) {
            return response()->json([
                'message' => "Cannot delete subject '{$subject->name}' because student exam marks have already been recorded for it. Remove marks first.",
            ], 422);
        }

        $name = $subject->name;
        $subject->delete();

        return response()->json([
            'message' => "Subject '{$name}' deleted successfully.",
        ]);
    }

    /**
     * Check tenant ownership.
     */
    protected function authorizeTenant(Subject $subject): void
    {
        if (auth()->check() && auth()->user()->school_id && $subject->school_id !== auth()->user()->school_id) {
            abort(403, 'Unauthorized access to this school tenant.');
        }
    }
}
