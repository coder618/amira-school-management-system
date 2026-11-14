<?php

namespace App\Modules\FundCollectionName\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\FundCollectionName\Models\FundCollectionName;
use App\Modules\FundCollectionName\Requests\StoreFundCollectionNameRequest;
use App\Modules\FundCollectionName\Requests\UpdateFundCollectionNameRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FundCollectionNameController extends Controller
{
    /**
     * List all fund collection names for the current tenant school.
     */
    public function index(Request $request): JsonResponse
    {
        $query = FundCollectionName::withCount('payments')
            ->forTenant();

        if ($request->filled('interval')) {
            $query->where('interval', $request->query('interval'));
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $collections = $query->orderBy('name', 'asc')->get();

        return response()->json($collections);
    }

    /**
     * Store a new fund collection name unique to the tenant school.
     */
    public function store(StoreFundCollectionNameRequest $request): JsonResponse
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

        $collection = FundCollectionName::create($validated);
        $collection->loadCount('payments');

        return response()->json($collection, 201);
    }

    /**
     * Show a specific fund collection name.
     */
    public function show(FundCollectionName $fundCollectionName): JsonResponse
    {
        $this->authorizeTenant($fundCollectionName);

        $fundCollectionName->loadCount('payments');

        return response()->json($fundCollectionName);
    }

    /**
     * Update an existing fund collection name.
     */
    public function update(UpdateFundCollectionNameRequest $request, FundCollectionName $fundCollectionName): JsonResponse
    {
        $this->authorizeTenant($fundCollectionName);

        $validated = $request->validated();
        $fundCollectionName->update($validated);
        $fundCollectionName->loadCount('payments');

        return response()->json($fundCollectionName);
    }

    /**
     * Delete a fund collection name if no payments are attached.
     */
    public function destroy(FundCollectionName $fundCollectionName): JsonResponse
    {
        $this->authorizeTenant($fundCollectionName);

        if ($fundCollectionName->payments()->exists()) {
            return response()->json([
                'message' => "Cannot delete collection name '{$fundCollectionName->name}' because payment transactions are attached to it.",
            ], 422);
        }

        $name = $fundCollectionName->name;
        $fundCollectionName->delete();

        return response()->json([
            'message' => "Fund collection name '{$name}' deleted successfully.",
        ]);
    }

    /**
     * Check tenant ownership.
     */
    protected function authorizeTenant(FundCollectionName $fundCollectionName): void
    {
        if (auth()->check() && auth()->user()->school_id && $fundCollectionName->school_id !== auth()->user()->school_id) {
            abort(403, 'Unauthorized access to this school tenant.');
        }
    }
}

