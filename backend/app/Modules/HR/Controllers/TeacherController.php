<?php

namespace App\Modules\HR\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Core\Enums\Role;
use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use App\Modules\HR\Models\Teacher;
use App\Modules\HR\Requests\StoreTeacherRequest;
use App\Modules\HR\Requests\UpdateTeacherRequest;
use App\Modules\Media\Services\MediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TeacherController extends Controller
{
    protected MediaService $mediaService;

    public function __construct(MediaService $mediaService)
    {
        $this->mediaService = $mediaService;
    }

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
        $user = $request->user();
        if (! $this->isAdminUser($user)) {
            return response()->json([
                'message' => 'Unauthorized. Only users with the Admin role can recruit faculty members.',
            ], 403);
        }

        $validated = $request->validated();

        $schoolId = auth()->user()?->school_id
            ?? ($request->hasHeader('X-School-Id') ? (int) $request->header('X-School-Id') : null)
            ?? School::first()?->id;

        $profilePicturePath = null;
        $uploadedMedia = null;
        $imageKey = $request->hasFile('profile_picture') ? 'profile_picture' : ($request->hasFile('image') ? 'image' : null);

        if ($imageKey) {
            $media = $this->mediaService->upload(
                file: $request->file($imageKey),
                schoolId: $schoolId,
                collectionName: 'teacher_profiles',
                userId: auth()->id()
            );
            $profilePicturePath = $media->file_path;
            $uploadedMedia = $media;
        } elseif ($request->filled('profile_picture')) {
            $profilePicturePath = $request->input('profile_picture');
        } elseif ($request->filled('image')) {
            $profilePicturePath = $request->input('image');
        }

        $teacher = DB::transaction(function () use ($validated, $schoolId, $profilePicturePath, $uploadedMedia) {
            $user = User::create([
                'school_id' => $schoolId,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password'] ?? 'teacher123'),
                'role' => Role::Teacher->value,
                'phone_number' => $validated['phone_number'] ?? null,
                'profile_picture' => $profilePicturePath,
            ]);

            $newTeacher = Teacher::create([
                'school_id' => $schoolId,
                'user_id' => $user->id,
                'employee_id' => $validated['employee_id'],
                'designation' => $validated['designation'],
                'department' => $validated['department'] ?? 'General',
                'qualification' => $validated['qualification'] ?? null,
                'phone_number' => $validated['phone_number'] ?? null,
                'card_rfid' => $validated['card_rfid'] ?? null,
                'biometric_id' => $validated['biometric_id'] ?? null,
                'joining_date' => $validated['joining_date'] ?? now()->toDateString(),
            ]);

            if ($uploadedMedia) {
                $uploadedMedia->update([
                    'model_type' => Teacher::class,
                    'model_id' => $newTeacher->id,
                ]);
            }

            return $newTeacher;
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
        $user = $request->user();
        if (! $this->isAdminUser($user)) {
            return response()->json([
                'message' => 'Unauthorized. Only users with the Admin role can update faculty records.',
            ], 403);
        }

        $validated = $request->validated();

        $schoolId = $teacher->school_id;
        $profilePicturePath = null;
        $uploadedMedia = null;
        $imageKey = $request->hasFile('profile_picture') ? 'profile_picture' : ($request->hasFile('image') ? 'image' : null);

        if ($imageKey) {
            $media = $this->mediaService->upload(
                file: $request->file($imageKey),
                schoolId: $schoolId,
                collectionName: 'teacher_profiles',
                userId: auth()->id()
            );
            $profilePicturePath = $media->file_path;
            $uploadedMedia = $media;
        } elseif ($request->filled('profile_picture')) {
            $profilePicturePath = $request->input('profile_picture');
        } elseif ($request->filled('image')) {
            $profilePicturePath = $request->input('image');
        }

        DB::transaction(function () use ($teacher, $validated, $profilePicturePath, $uploadedMedia) {
            $userUpdates = [];
            if (isset($validated['name'])) {
                $userUpdates['name'] = $validated['name'];
            }
            if (isset($validated['email'])) {
                $userUpdates['email'] = $validated['email'];
            }
            if (!empty($validated['password'])) {
                $userUpdates['password'] = Hash::make($validated['password']);
            }
            if (isset($validated['phone_number'])) {
                $userUpdates['phone_number'] = $validated['phone_number'];
            }
            if ($profilePicturePath !== null) {
                $userUpdates['profile_picture'] = $profilePicturePath;
            }

            if (!empty($userUpdates) && $teacher->user) {
                $teacher->user()->update($userUpdates);
            }

            $teacher->update($validated);

            if ($uploadedMedia) {
                $uploadedMedia->update([
                    'model_type' => Teacher::class,
                    'model_id' => $teacher->id,
                ]);
            }
        });

        $teacher->load(['user', 'assignedSections']);

        return response()->json([
            'message' => 'Teacher record updated',
            'data' => $teacher,
        ]);
    }

    public function destroy(Teacher $teacher): JsonResponse
    {
        $user = request()->user();
        if (! $this->isAdminUser($user)) {
            return response()->json([
                'message' => 'Unauthorized. Only users with the Admin role can remove faculty records.',
            ], 403);
        }

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

    /**
     * Check if user has admin privileges.
     */
    protected function isAdminUser(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        $role = strtolower((string) $user->role);

        return in_array($role, ['admin', 'superadmin'], true)
            || (method_exists($user, 'isAdmin') && $user->isAdmin())
            || (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin());
    }
}

