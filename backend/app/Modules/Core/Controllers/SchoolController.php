<?php

namespace App\Modules\Core\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Core\Enums\Role;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SchoolController extends Controller
{
    /**
     * List all onboarded tenant schools (SuperAdmin only).
     */
    public function index(Request $request): JsonResponse
    {
        $schools = School::with([
            'users' => function ($q) {
                $q->where('role', Role::Admin->value);
            },
            'currentAcademicYear',
        ])
            ->withCount(['users', 'academicYears'])
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($schools);
    }

    /**
     * Create a new School and automatically provision the initial Headmaster/Admin account.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'headmaster_email' => 'required|email|max:255|unique:users,email',
            'headmaster_password' => 'required|string|min:6',
            'headmaster_name' => 'nullable|string|max:150',
            'code' => 'nullable|string|max:50|unique:schools,code',
            'eiin' => 'nullable|string|max:20',
            'board' => 'nullable|string|max:50',
            'phone' => ['nullable', 'string', 'regex:/^01[3-9]\d{8}$/'],
            'email' => 'nullable|email|max:255',
        ], [
            'phone.regex' => 'The school phone must be an 11-digit Bangladeshi number (e.g. 01712345678).',
            'headmaster_email.unique' => 'A user account with this Headmaster email already exists.',
        ]);

        $result = DB::transaction(function () use ($validated) {
            // 1. Generate School Code if not provided
            $code = ! empty($validated['code'])
                ? strtoupper(trim($validated['code']))
                : 'SCH-' . strtoupper(Str::random(6));

            // 2. Create Tenant School
            $school = School::create([
                'name' => trim($validated['name']),
                'code' => $code,
                'eiin' => $validated['eiin'] ?? null,
                'board' => $validated['board'] ?? 'Dhaka',
                'address' => trim($validated['address']),
                'phone' => $validated['phone'] ?? null,
                'email' => $validated['email'] ?? $validated['headmaster_email'],
                'is_active' => true,
            ]);

            // 3. Automatically provision active current Academic Year
            $currentYear = date('Y');
            $academicYear = AcademicYear::create([
                'school_id' => $school->id,
                'title' => "{$currentYear}-" . ($currentYear + 1),
                'start_date' => "{$currentYear}-01-01",
                'end_date' => "{$currentYear}-12-31",
                'is_current' => true,
            ]);

            // 4. Automatically generate Headmaster / Admin User Account tied to school_id
            $headmasterName = ! empty($validated['headmaster_name'])
                ? trim($validated['headmaster_name'])
                : 'Headmaster (' . $school->name . ')';

            $headmaster = User::create([
                'school_id' => $school->id,
                'name' => $headmasterName,
                'email' => trim($validated['headmaster_email']),
                'password' => Hash::make($validated['headmaster_password']),
                'role' => Role::Admin->value,
                'phone_number' => $validated['phone'] ?? null,
                'is_active' => true,
            ]);

            return [
                'school' => $school,
                'academic_year' => $academicYear,
                'headmaster' => $headmaster,
            ];
        });

        return response()->json([
            'message' => "School '{$result['school']->name}' onboarded successfully. Headmaster admin account generated.",
            'school' => $result['school'],
            'academic_year' => $result['academic_year'],
            'headmaster' => [
                'id' => $result['headmaster']->id,
                'name' => $result['headmaster']->name,
                'email' => $result['headmaster']->email,
                'role' => $result['headmaster']->role,
                'school_id' => $result['headmaster']->school_id,
            ],
        ], 201);
    }
}

