<?php

namespace App\Modules\HR\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Core\Enums\Role;
use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use App\Modules\HR\Models\Teacher;
use App\Modules\HR\Requests\StoreTeacherRequest;
use App\Modules\HR\Requests\UpdateTeacherRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TeacherController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Teacher::with(['user', 'assignedSections.classLevel'])
            ->forTenant();

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('employee_id', 'like', "%{$search}%")
                    ->orWhere('designation', 'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('department')) {
            $query->where('department', $request->query('department'));
        }

        $teachers = $query->orderBy('id', 'desc')->get();

        return response()->json($teachers);
    }

    public function store(StoreTeacherRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $schoolId = auth()->user()?->school_id
            ?? ($request->hasHeader('X-School-Id') ? (int) $request->header('X-School-Id') : null)
            ?? School::first()?->id;

        $teacher = DB::transaction(function () use ($validated, $schoolId) {
            $user = User::create([
                'school_id' => $schoolId,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password'] ?? 'teacher123'),
                'role' => Role::Teacher->value,
                'phone_number' => $validated['phone_number'] ?? null,
            ]);

            return Teacher::create([
                'school_id' => $schoolId,
                'user_id' => $user->id,
                'employee_id' => $validated['employee_id'],
                'designation' => $validated['designation'],
                'department' => $validated['department'] ?? 'General',
                'qualification' => $validated['qualification'] ?? null,
                'phone_number' => $validated['phone_number'] ?? null,
                'joining_date' => $validated['joining_date'] ?? now()->toDateString(),
            ]);
        });

        $teacher->load(['user', 'assignedSections']);

        return response()->json([
            'message' => 'Teacher recruited and account created successfully',
            'data' => $teacher,
        ], 201);
    }

    public function show(Teacher $teacher): JsonResponse
    {
        $teacher->load(['user', 'assignedSections.classLevel']);

        return response()->json($teacher);
    }

    public function update(UpdateTeacherRequest $request, Teacher $teacher): JsonResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($teacher, $validated) {
            if (isset($validated['name'])) {
                $teacher->user()->update([
                    'name' => $validated['name'],
                    'phone_number' => $validated['phone_number'] ?? $teacher->phone_number,
                ]);
            }
            $teacher->update($validated);
        });

        $teacher->load(['user', 'assignedSections']);

        return response()->json([
            'message' => 'Teacher record updated',
            'data' => $teacher,
        ]);
    }

    public function destroy(Teacher $teacher): JsonResponse
    {
        DB::transaction(function () use ($teacher) {
            $user = $teacher->user;
            $teacher->delete();
            if ($user) {
                $user->delete();
            }
        });

        return response()->json([
            'message' => 'Teacher profile removed',
        ]);
    }
}

