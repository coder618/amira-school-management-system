<?php

namespace App\Modules\HR\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Models\TeacherNote;
use App\Modules\Attendance\Models\AttendanceDeviceLog;
use App\Modules\Attendance\Models\Holiday;
use App\Modules\Core\Enums\Role;
use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use App\Modules\HR\Models\Teacher;
use App\Modules\HR\Requests\StoreTeacherRequest;
use App\Modules\HR\Requests\UpdateTeacherRequest;
use App\Modules\Media\Services\MediaService;
use Carbon\Carbon;
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

        if (request()->boolean('full_summary')) {
            return $this->fullSummary($teacher);
        }

        return response()->json($teacher);
    }

    /**
     * Get a comprehensive summary for a teacher including:
     * - Last 10 days attendance (with device punches In/Out, absence, and holiday calendar consideration)
     * - Given teacher notes list with linked student details
     */
    public function fullSummary(Teacher $teacher): JsonResponse
    {
        $user = auth()->user();
        if ($user && $user->school_id && $teacher->school_id !== $user->school_id && ! $this->isAdminUser($user)) {
            return response()->json(['message' => 'Unauthorized access to faculty record.'], 403);
        }

        $teacher->load(['user', 'assignedSections.classLevel']);

        // 1. Last 10 days attendance
        $today = Carbon::today();
        $startDate = $today->copy()->subDays(9)->toDateString();
        $endDate = $today->toDateString();

        // Query holidays in this school
        $holidays = Holiday::where('school_id', $teacher->school_id)
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('date', [$startDate, $endDate])
                    ->orWhereBetween('end_date', [$startDate, $endDate])
                    ->orWhere(function ($q) use ($startDate, $endDate) {
                        $q->where('date', '<=', $endDate)
                            ->where('end_date', '>=', $startDate);
                    });
            })
            ->get();

        // Device punch logs for this teacher
        $deviceLogs = AttendanceDeviceLog::where('school_id', $teacher->school_id)
            ->where(function ($q) use ($teacher) {
                $q->where('teacher_id', $teacher->id);
                if ($teacher->user_id) {
                    $q->orWhere('user_id', $teacher->user_id);
                }
            })
            ->whereDate('punched_at', '>=', $startDate)
            ->whereDate('punched_at', '<=', $endDate)
            ->where('status', 'success')
            ->orderBy('punched_at', 'asc')
            ->get()
            ->groupBy(fn ($log) => Carbon::parse($log->punched_at)->toDateString());

        $attendanceHistory = [];
        for ($i = 0; $i < 10; $i++) {
            $curDate = $today->copy()->subDays($i);
            $dateStr = $curDate->toDateString();
            $dayOfWeek = $curDate->format('l');

            $holiday = $holidays->first(function ($h) use ($dateStr) {
                $hStart = Carbon::parse($h->date)->toDateString();
                $hEnd = $h->end_date ? Carbon::parse($h->end_date)->toDateString() : $hStart;
                return $dateStr >= $hStart && $dateStr <= $hEnd;
            });

            $dayLogs = $deviceLogs->get($dateStr);
            $inTime = null;
            $outTime = null;
            $punchCount = 0;

            if ($dayLogs && $dayLogs->count() > 0) {
                $punchCount = $dayLogs->count();
                $firstPunch = $dayLogs->first();
                $inTime = Carbon::parse($firstPunch->punched_at)->format('h:i A');

                if ($dayLogs->count() > 1) {
                    $lastPunch = $dayLogs->last();
                    $outTime = Carbon::parse($lastPunch->punched_at)->format('h:i A');
                }
            }

            if ($dayLogs && $dayLogs->count() > 0) {
                $status = 'Present';
                $remarks = $holiday
                    ? "Present on Holiday ({$holiday->title})"
                    : ($punchCount > 1 ? "Recorded {$punchCount} device punches" : "Punched In at {$inTime}");
            } elseif ($holiday) {
                $status = 'Holiday';
                $remarks = $holiday->title . ($holiday->type ? " ({$holiday->type})" : '');
            } else {
                $status = 'Absent';
                $remarks = 'No attendance recorded (Absent)';
            }

            $attendanceHistory[] = [
                'id' => $i + 1,
                'date' => $dateStr,
                'day' => $dayOfWeek,
                'status' => $status,
                'in_time' => $inTime,
                'out_time' => $outTime,
                'punch_count' => $punchCount,
                'remarks' => $remarks,
                'is_holiday' => $holiday !== null,
                'holiday' => $holiday ? ['title' => $holiday->title, 'type' => $holiday->type] : null,
            ];
        }

        // 2. Given teacher notes list with student name with link
        $teacherNotes = TeacherNote::with(['student.classLevel', 'student.section', 'author:id,name'])
            ->where(function ($q) use ($teacher) {
                $q->where('teacher_id', $teacher->id);
                if ($teacher->user_id) {
                    $q->orWhere('author_id', $teacher->user_id);
                }
            })
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->take(10)
            ->get();

        return response()->json([
            'teacher' => $teacher,
            'attendance' => [
                'total' => count($attendanceHistory),
                'data' => $attendanceHistory,
            ],
            'teacher_notes' => [
                'total' => $teacherNotes->count(),
                'data' => $teacherNotes,
            ],
        ]);
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

