<?php

namespace App\Modules\Academic\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Models\Student;
use App\Modules\Academic\Requests\StoreStudentRequest;
use App\Modules\Academic\Requests\UpdateStudentRequest;
use App\Modules\Core\Enums\Role;
use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use App\Modules\Media\Services\MediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StudentController extends Controller
{
    protected MediaService $mediaService;

    public function __construct(MediaService $mediaService)
    {
        $this->mediaService = $mediaService;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Student::with(['classLevel', 'section', 'shift', 'user'])
            ->forTenant();

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('student_id', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('class_level_id')) {
            $query->where('class_level_id', $request->query('class_level_id'));
        }

        if ($request->filled('section_id')) {
            $query->where('section_id', $request->query('section_id'));
        }

        if ($request->filled('shift_id')) {
            $query->where('shift_id', $request->query('shift_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $students = $query->orderBy('roll_number', 'asc')->get();

        return response()->json($students);
    }

    public function store(StoreStudentRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $schoolId = auth()->user()?->school_id
            ?? ($request->header('X-School-Id') ? (int) $request->header('X-School-Id') : null)
            ?? School::first()?->id;

        $uploadedMedia = [];

        foreach (['student_image', 'parent_image', 'father_image', 'mother_image'] as $imageKey) {
            if ($request->hasFile($imageKey)) {
                $collection = ($imageKey === 'student_image') ? 'student_images' : 'parent_images';
                $media = $this->mediaService->upload(
                    file: $request->file($imageKey),
                    schoolId: $schoolId,
                    collectionName: $collection,
                    userId: auth()->id()
                );
                $validated[$imageKey] = $media->file_path;
                $uploadedMedia[] = $media;
            } elseif ($request->filled($imageKey)) {
                $validated[$imageKey] = $request->input($imageKey);
            }
        }

        $student = DB::transaction(function () use ($validated, $request, $schoolId, $uploadedMedia) {
            $fullName = trim("{$validated['first_name']} " . ($validated['last_name'] ?? ''));

            // Determine unique student user email
            if (! empty($validated['email'])) {
                $studentEmail = $validated['email'];
            } else {
                $cleanId = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $validated['student_id']));
                $studentEmail = "{$cleanId}@student.school.edu.bd";
                $counter = 1;
                while (User::where('email', $studentEmail)->exists()) {
                    $studentEmail = "{$cleanId}{$counter}@student.school.edu.bd";
                    $counter++;
                }
            }

            $profilePicture = $validated['student_image'] ?? null;

            // Create user account with Student role
            $user = User::create([
                'school_id' => $schoolId,
                'name' => $fullName,
                'email' => $studentEmail,
                'password' => Hash::make($request->input('password', 'student123')),
                'role' => Role::Student->value,
                'phone_number' => $validated['phone_number'] ?? null,
                'profile_picture' => $profilePicture,
                'is_active' => true,
            ]);

            $validated['school_id'] = $schoolId;
            $validated['user_id'] = $user->id;
            $validated['email'] = $studentEmail;

            $newStudent = Student::create($validated);

            foreach ($uploadedMedia as $m) {
                $m->update([
                    'model_type' => Student::class,
                    'model_id' => $newStudent->id,
                ]);
            }

            return $newStudent;
        });

        $student->load(['classLevel', 'section', 'shift', 'user']);

        return response()->json([
            'message' => 'Student enrolled successfully and user account created with Student role',
            'data' => $student,
        ], 201);
    }

    public function show(Request $request, Student $student): JsonResponse
    {
        $schoolId = auth()->user()?->school_id
            ?? ($request->header('X-School-Id') ? (int) $request->header('X-School-Id') : null);

        if ($schoolId && $student->school_id !== $schoolId) {
            return response()->json(['message' => 'Student record not found in this school.'], 404);
        }

        $student->load(['classLevel', 'section', 'shift', 'school', 'academicYear', 'user', 'media']);

        return response()->json($student);
    }

    public function update(UpdateStudentRequest $request, Student $student): JsonResponse
    {
        $validated = $request->validated();
        $schoolId = $student->school_id;

        $uploadedMedia = [];

        foreach (['student_image', 'parent_image', 'father_image', 'mother_image'] as $imageKey) {
            if ($request->hasFile($imageKey)) {
                $collection = ($imageKey === 'student_image') ? 'student_images' : 'parent_images';
                $media = $this->mediaService->upload(
                    file: $request->file($imageKey),
                    schoolId: $schoolId,
                    collectionName: $collection,
                    userId: auth()->id(),
                    model: $student
                );
                $validated[$imageKey] = $media->file_path;
                $uploadedMedia[] = $media;
            } elseif ($request->filled($imageKey)) {
                $validated[$imageKey] = $request->input($imageKey);
            }
        }

        DB::transaction(function () use ($student, $validated) {
            if ($student->user) {
                $userUpdates = [];
                if (isset($validated['first_name']) || isset($validated['last_name'])) {
                    $firstName = $validated['first_name'] ?? $student->first_name;
                    $lastName = $validated['last_name'] ?? $student->last_name;
                    $userUpdates['name'] = trim("{$firstName} {$lastName}");
                }
                if (isset($validated['phone_number'])) {
                    $userUpdates['phone_number'] = $validated['phone_number'];
                }
                if (isset($validated['student_image'])) {
                    $userUpdates['profile_picture'] = $validated['student_image'];
                }
                if (! empty($userUpdates)) {
                    $student->user()->update($userUpdates);
                }
            }
            $student->update($validated);
        });

        $student->load(['classLevel', 'section', 'shift', 'user']);

        return response()->json([
            'message' => 'Student record updated',
            'data' => $student,
        ]);
    }

    public function destroy(Student $student): JsonResponse
    {
        DB::transaction(function () use ($student) {
            $user = $student->user;
            $student->delete();
            if ($user && $user->role === Role::Student->value) {
                $user->delete();
            }
        });

        return response()->json([
            'message' => 'Student record and user account removed successfully',
        ]);
    }
}
