<?php

namespace App\Modules\Attendance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Attendance\Models\Holiday;
use App\Modules\Core\Enums\Role;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HolidayController extends Controller
{
    /**
     * Check if authenticated user has administrative privileges to manage holidays.
     */
    protected function authorizeAdmin(Request $request): void
    {
        $user = $request->user();

        $isAdmin = $user && (
            $user->role === Role::Admin->value ||
            $user->role === Role::SuperAdmin->value ||
            (method_exists($user, 'isAdmin') && $user->isAdmin()) ||
            (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin())
        );

        if (! $isAdmin) {
            abort(403, 'Unauthorized. Only school administrators can manage holidays.');
        }
    }

    /**
     * List holidays with flexible filtering (by year, month, date range, or title search).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Holiday::with('creator:id,name,email')
            ->forTenant();

        // Filter by calendar year (e.g. 2026)
        if ($request->filled('year')) {
            $year = (int) $request->query('year');
            $query->inYear($year);
        }

        // Filter by month (1 - 12)
        if ($request->filled('month')) {
            $month = (int) $request->query('month');
            $year = $request->filled('year') ? (int) $request->query('year') : (int) date('Y');
            $query->inMonth($year, $month);
        }

        // Filter by date range
        if ($request->filled('from') && $request->filled('to')) {
            $from = $request->query('from');
            $to = $request->query('to');
            $query->where(function ($q) use ($from, $to) {
                $q->whereBetween('date', [$from, $to])
                    ->orWhere(function ($sub) use ($from, $to) {
                        $sub->whereNotNull('end_date')
                            ->where('date', '<=', $to)
                            ->where('end_date', '>=', $from);
                    });
            });
        }

        // Filter by holiday type
        if ($request->filled('type') && $request->query('type') !== 'all') {
            $query->where('type', $request->query('type'));
        }

        // Search by title or description
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $holidays = $query->orderBy('date', 'asc')->get();

        // Calculate upcoming count and total holidays this year
        $currentYear = (int) ($request->query('year') ?? date('Y'));
        $today = Carbon::today()->toDateString();

        $stats = [
            'total_in_query' => $holidays->count(),
            'total_year' => Holiday::forTenant()->inYear($currentYear)->count(),
            'upcoming' => Holiday::forTenant()
                ->where('date', '>=', $today)
                ->orderBy('date', 'asc')
                ->take(5)
                ->get(),
        ];

        return response()->json([
            'data' => $holidays,
            'stats' => $stats,
        ]);
    }

    /**
     * Create a new holiday entry (Admin only).
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:date',
            'type' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:1000',
            'is_half_day' => 'nullable|boolean',
            'academic_year_id' => 'nullable|exists:academic_years,id',
        ]);

        $schoolId = $request->user()->school_id ?? (int) $request->header('X-School-Id') ?? 1;

        $holiday = Holiday::create([
            'school_id' => $schoolId,
            'academic_year_id' => $validated['academic_year_id'] ?? null,
            'title' => $validated['title'],
            'date' => $validated['date'],
            'end_date' => $validated['end_date'] ?? null,
            'type' => $validated['type'] ?? 'General',
            'description' => $validated['description'] ?? null,
            'is_half_day' => (bool) ($validated['is_half_day'] ?? false),
            'created_by' => $request->user()->id,
        ]);

        $holiday->load('creator:id,name,email');

        return response()->json([
            'message' => "Holiday '{$holiday->title}' added successfully.",
            'data' => $holiday,
        ], 201);
    }

    /**
     * Show a specific holiday.
     */
    public function show(Request $request, Holiday $holiday): JsonResponse
    {
        $this->ensureTenantAccess($request, $holiday);

        $holiday->load('creator:id,name,email');

        return response()->json($holiday);
    }

    /**
     * Update an existing holiday (Admin only).
     */
    public function update(Request $request, Holiday $holiday): JsonResponse
    {
        $this->authorizeAdmin($request);
        $this->ensureTenantAccess($request, $holiday);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'date' => 'sometimes|required|date',
            'end_date' => 'nullable|date|after_or_equal:date',
            'type' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:1000',
            'is_half_day' => 'nullable|boolean',
            'academic_year_id' => 'nullable|exists:academic_years,id',
        ]);

        $holiday->update($validated);
        $holiday->load('creator:id,name,email');

        return response()->json([
            'message' => "Holiday '{$holiday->title}' updated successfully.",
            'data' => $holiday,
        ]);
    }

    /**
     * Delete a holiday entry (Admin only).
     */
    public function destroy(Request $request, Holiday $holiday): JsonResponse
    {
        $this->authorizeAdmin($request);
        $this->ensureTenantAccess($request, $holiday);

        $title = $holiday->title;
        $holiday->delete();

        return response()->json([
            'message' => "Holiday '{$title}' removed successfully.",
        ]);
    }

    /**
     * Quick check if a specific date is marked as a holiday for this school tenant.
     */
    public function checkDate(Request $request): JsonResponse
    {
        $request->validate([
            'date' => 'required|date',
        ]);

        $date = $request->query('date');
        $holiday = Holiday::forTenant()
            ->onDate($date)
            ->first();

        return response()->json([
            'date' => $date,
            'is_holiday' => $holiday !== null,
            'holiday' => $holiday,
        ]);
    }

    /**
     * Ensure the holiday belongs to the tenant.
     */
    protected function ensureTenantAccess(Request $request, Holiday $holiday): void
    {
        $user = $request->user();

        // SuperAdmin can access any tenant's holiday
        if ($user && ($user->role === Role::SuperAdmin->value || (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()))) {
            return;
        }

        if ($user && $user->school_id && $holiday->school_id !== $user->school_id) {
            abort(403, 'Unauthorized access to tenant holiday.');
        }
    }
}
