<?php

namespace App\Modules\SchoolClass\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\SchoolClass\Models\ClassLevel;
use App\Modules\SchoolClass\Requests\StoreClassLevelRequest;
use App\Modules\SchoolClass\Requests\UpdateClassLevelRequest;
use Illuminate\Http\JsonResponse;

class ClassLevelController extends Controller
{
    /**
     * List all class levels for the current school tenant.
     */
    public function index(): JsonResponse
    {
        $classes = ClassLevel::with(['sections.classTeacher.user'])
            ->withCount(['students', 'sections'])
            ->forTenant()
            ->orderBy('numeric_value', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json($classes);
    }

    /**
     * Store a new class level unique to the tenant school.
     */
    public function store(StoreClassLevelRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $schoolId = auth()->user()?->school_id
            ?? ($request->header('X-School-Id') ? (int) $request->header('X-School-Id') : null)
            ?? School::first()?->id;

        $validated['school_id'] = $schoolId;

        // Ensure academic_year_id is associated
        if (empty($validated['academic_year_id'])) {
            $academicYearId = (int) $request->header('X-Academic-Year-Id');
            if (! $academicYearId) {
                $currentYear = AcademicYear::where('school_id', $schoolId)->where('is_current', true)->first()
                    ?? AcademicYear::where('school_id', $schoolId)->first();
                $academicYearId = $currentYear?->id ?? AcademicYear::first()?->id;
            }
            $validated['academic_year_id'] = $academicYearId;
        }

        $class = ClassLevel::create($validated);
        $class->load('sections');
        $class->loadCount(['students', 'sections']);

        return response()->json($class, 201);
    }

    /**
     * Show a specific class level.
     */
    public function show(ClassLevel $classLevel): JsonResponse
    {
        $this->authorizeTenant($classLevel);

        $classLevel->load(['sections.classTeacher.user']);
        $classLevel->loadCount(['students', 'sections']);

        return response()->json($classLevel);
    }

    /**
     * Update an existing class level unique to the tenant school.
     */
    public function update(UpdateClassLevelRequest $request, ClassLevel $classLevel): JsonResponse
    {
        $this->authorizeTenant($classLevel);

        $validated = $request->validated();
        $classLevel->update($validated);

        $classLevel->load('sections');
        $classLevel->loadCount(['students', 'sections']);

        return response()->json($classLevel);
    }

    /**
     * Delete a class level if no students or sections are attached.
     */
    public function destroy(ClassLevel $classLevel): JsonResponse
    {
        $this->authorizeTenant($classLevel);

        if ($classLevel->students()->exists()) {
            return response()->json([
                'message' => "Cannot delete class '{$classLevel->name}' because active students are enrolled in it.",
            ], 422);
        }

        if ($classLevel->sections()->exists()) {
            return response()->json([
                'message' => "Cannot delete class '{$classLevel->name}' because sections are attached. Remove or reassign sections first.",
            ], 422);
        }

        $classLevel->delete();

        return response()->json([
            'message' => "Class '{$classLevel->name}' deleted successfully",
        ]);
    }

    /**
     * Check tenant ownership.
     */
    protected function authorizeTenant(ClassLevel $classLevel): void
    {
        if (auth()->check() && auth()->user()->school_id && $classLevel->school_id !== auth()->user()->school_id) {
            abort(403, 'Unauthorized access to this school tenant.');
        }
    }
}

