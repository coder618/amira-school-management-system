<?php

namespace App\Modules\Attendance\Services;

use App\Modules\Academic\Models\Shift;
use App\Modules\Academic\Models\Student;
use App\Modules\Attendance\Events\AttendanceMarked;
use App\Modules\Attendance\Models\Attendance;
use App\Modules\Attendance\Models\AttendanceDevice;
use App\Modules\Attendance\Models\AttendanceDeviceLog;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\User;
use App\Modules\HR\Models\Teacher;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AttendanceDeviceService
{
    /**
     * Resolve attendance device by token or identifier.
     */
    public function resolveDevice(?string $token, ?string $deviceIdentifier = null, ?int $schoolId = null): ?AttendanceDevice
    {
        if (! empty($token)) {
            $device = AttendanceDevice::where('api_token', $token)->first();
            if ($device) {
                return $device;
            }
        }

        if (! empty($deviceIdentifier) && ! empty($schoolId)) {
            return AttendanceDevice::where('school_id', $schoolId)
                ->where('device_id', $deviceIdentifier)
                ->first();
        }

        return null;
    }

    /**
     * Process a single device punch.
     *
     * @param array $data Contains identifier, punched_at, punch_type, verification_method, etc.
     * @param AttendanceDevice|null $device
     * @param int|null $forcedSchoolId
     * @return array Result information
     */
    public function processPunch(array $data, ?AttendanceDevice $device = null, ?int $forcedSchoolId = null): array
    {
        $schoolId = $device?->school_id ?? $forcedSchoolId ?? auth()->user()?->school_id ?? 1;
        $rawIdentifier = trim((string) ($data['identifier'] ?? $data['card_number'] ?? $data['user_code'] ?? ''));

        if (empty($rawIdentifier)) {
            return [
                'status' => 'error',
                'message' => 'No user/card identifier provided in punch data.',
            ];
        }

        $punchedAt = ! empty($data['punched_at'])
            ? Carbon::parse($data['punched_at'])
            : Carbon::now();

        $punchType = $data['punch_type'] ?? 'check_in';
        $verificationMethod = $data['verification_method'] ?? 'card';

        // 1. Try matching a Student in this school
        $student = Student::with(['classLevel', 'section', 'shift'])
            ->where('school_id', $schoolId)
            ->where('status', 'active')
            ->where(function ($query) use ($rawIdentifier) {
                $query->where('card_rfid', $rawIdentifier)
                    ->orWhere('biometric_id', $rawIdentifier)
                    ->orWhere('student_id', $rawIdentifier);
            })
            ->first();

        if ($student) {
            return $this->recordStudentPunch($student, $device, $schoolId, $rawIdentifier, $punchedAt, $punchType, $verificationMethod, $data);
        }

        // 2. Try matching a Teacher in this school
        $teacher = Teacher::with('user')
            ->where('school_id', $schoolId)
            ->where(function ($query) use ($rawIdentifier) {
                $query->where('card_rfid', $rawIdentifier)
                    ->orWhere('biometric_id', $rawIdentifier)
                    ->orWhere('employee_id', $rawIdentifier);
            })
            ->first();

        if ($teacher) {
            return $this->recordTeacherPunch($teacher, $device, $schoolId, $rawIdentifier, $punchedAt, $punchType, $verificationMethod, $data);
        }

        // 3. Try matching a general User in this school
        $user = User::where('school_id', $schoolId)
            ->where(function ($query) use ($rawIdentifier) {
                $query->where('card_rfid', $rawIdentifier)
                    ->orWhere('email', $rawIdentifier)
                    ->orWhere('phone_number', $rawIdentifier);
            })
            ->first();

        if ($user) {
            return $this->recordUserPunch($user, $device, $schoolId, $rawIdentifier, $punchedAt, $punchType, $verificationMethod, $data);
        }

        // 4. Unrecognized punch: log for admin investigation and card assignment
        $log = AttendanceDeviceLog::create([
            'school_id' => $schoolId,
            'attendance_device_id' => $device?->id,
            'device_identifier' => $device?->device_id ?? ($data['device_identifier'] ?? null),
            'raw_identifier' => $rawIdentifier,
            'user_type' => 'unknown',
            'user_id' => null,
            'student_id' => null,
            'teacher_id' => null,
            'punched_at' => $punchedAt,
            'punch_type' => $punchType,
            'verification_method' => $verificationMethod,
            'status' => 'unrecognized',
            'response_message' => "Unrecognized card or device ID: [{$rawIdentifier}]. Not assigned to any student or staff.",
            'payload_json' => $data,
        ]);

        if ($device) {
            $device->update(['last_sync_at' => Carbon::now()]);
        }

        return [
            'status' => 'unrecognized',
            'log_id' => $log->id,
            'identifier' => $rawIdentifier,
            'device' => $device?->name ?? 'External Device',
            'punched_at' => $punchedAt->toDateTimeString(),
            'message' => "Unrecognized identifier: {$rawIdentifier}. Card/ID is not mapped to any active student or staff member.",
        ];
    }

    /**
     * Process multiple punches (batch from sync daemon or offline device dump).
     */
    public function processBatch(array $punches, ?AttendanceDevice $device = null, ?int $schoolId = null): array
    {
        $results = [];
        $successCount = 0;
        $unrecognizedCount = 0;
        $errorCount = 0;

        foreach ($punches as $item) {
            if (! is_array($item)) {
                continue;
            }

            $res = $this->processPunch($item, $device, $schoolId);
            $results[] = $res;

            if (($res['status'] ?? '') === 'success') {
                $successCount++;
            } elseif (($res['status'] ?? '') === 'unrecognized') {
                $unrecognizedCount++;
            } else {
                $errorCount++;
            }
        }

        return [
            'total' => count($punches),
            'success_count' => $successCount,
            'unrecognized_count' => $unrecognizedCount,
            'error_count' => $errorCount,
            'results' => $results,
        ];
    }

    /**
     * Record student punch into attendance sheet and device logs.
     */
    protected function recordStudentPunch(
        Student $student,
        ?AttendanceDevice $device,
        int $schoolId,
        string $rawIdentifier,
        Carbon $punchedAt,
        string $punchType,
        string $verificationMethod,
        array $rawData
    ): array {
        $date = $punchedAt->toDateString();
        $academicYearId = $student->academic_year_id;

        if (empty($academicYearId)) {
            $currentYear = AcademicYear::where('school_id', $schoolId)->where('is_current', true)->first();
            $academicYearId = $currentYear?->id ?? 1;
        }

        // Determine if Late or Present
        $status = 'Present';
        if ($student->shift_id && $student->shift) {
            $startTime = $student->shift->start_time;
            if (! empty($startTime)) {
                $shiftStart = Carbon::parse($date . ' ' . $startTime);
                // Allow a 15-minute grace period before marking late
                if ($punchedAt->greaterThan($shiftStart->copy()->addMinutes(15))) {
                    $status = 'Late';
                }
            }
        }

        $deviceName = $device ? $device->name : 'External Device';
        $timeStr = $punchedAt->format('h:i:s A');
        $remarks = "Auto-recorded via {$deviceName} ({$verificationMethod}) at {$timeStr}";

        // Upsert into main attendances table
        $attendance = Attendance::updateOrCreate(
            [
                'school_id' => $schoolId,
                'academic_year_id' => $academicYearId,
                'student_id' => $student->id,
                'date' => $date,
            ],
            [
                'section_id' => $student->section_id,
                'status' => $status,
                'remarks' => $remarks,
            ]
        );

        $attendance->load('student.school');

        // Log entry
        $log = AttendanceDeviceLog::create([
            'school_id' => $schoolId,
            'attendance_device_id' => $device?->id,
            'device_identifier' => $device?->device_id ?? ($rawData['device_identifier'] ?? null),
            'raw_identifier' => $rawIdentifier,
            'user_type' => 'student',
            'user_id' => $student->user_id,
            'student_id' => $student->id,
            'teacher_id' => null,
            'punched_at' => $punchedAt,
            'punch_type' => $punchType,
            'verification_method' => $verificationMethod,
            'status' => 'success',
            'response_message' => "Attendance recorded for {$student->full_name} ({$status})",
            'payload_json' => $rawData,
        ]);

        if ($device) {
            $device->update(['last_sync_at' => Carbon::now()]);
        }

        return [
            'status' => 'success',
            'user_type' => 'student',
            'student_id' => $student->id,
            'name' => $student->full_name,
            'identifier' => $student->student_id,
            'class' => $student->classLevel?->name ?? 'N/A',
            'section' => $student->section?->name ?? 'N/A',
            'roll_number' => $student->roll_number,
            'attendance_status' => $status,
            'punched_at' => $punchedAt->toDateTimeString(),
            'device' => $deviceName,
            'photo_url' => $student->student_image_url,
            'message' => "Welcome {$student->full_name}! Marked {$status} at {$timeStr}.",
            'log_id' => $log->id,
            'attendance_id' => $attendance->id,
        ];
    }

    /**
     * Record teacher punch.
     */
    protected function recordTeacherPunch(
        Teacher $teacher,
        ?AttendanceDevice $device,
        int $schoolId,
        string $rawIdentifier,
        Carbon $punchedAt,
        string $punchType,
        string $verificationMethod,
        array $rawData
    ): array {
        $deviceName = $device ? $device->name : 'External Device';
        $timeStr = $punchedAt->format('h:i:s A');
        $name = $teacher->user?->name ?? 'Teacher ' . $teacher->employee_id;

        $log = AttendanceDeviceLog::create([
            'school_id' => $schoolId,
            'attendance_device_id' => $device?->id,
            'device_identifier' => $device?->device_id ?? ($rawData['device_identifier'] ?? null),
            'raw_identifier' => $rawIdentifier,
            'user_type' => 'teacher',
            'user_id' => $teacher->user_id,
            'student_id' => null,
            'teacher_id' => $teacher->id,
            'punched_at' => $punchedAt,
            'punch_type' => $punchType,
            'verification_method' => $verificationMethod,
            'status' => 'success',
            'response_message' => "Staff punch recorded for {$name} ({$teacher->designation})",
            'payload_json' => $rawData,
        ]);

        if ($device) {
            $device->update(['last_sync_at' => Carbon::now()]);
        }

        return [
            'status' => 'success',
            'user_type' => 'teacher',
            'teacher_id' => $teacher->id,
            'name' => $name,
            'identifier' => $teacher->employee_id,
            'designation' => $teacher->designation,
            'department' => $teacher->department,
            'attendance_status' => 'Present',
            'punched_at' => $punchedAt->toDateTimeString(),
            'device' => $deviceName,
            'photo_url' => $teacher->profile_picture_url,
            'message' => "Welcome {$name}! Staff punch recorded at {$timeStr}.",
            'log_id' => $log->id,
        ];
    }

    /**
     * Record general user punch.
     */
    protected function recordUserPunch(
        User $user,
        ?AttendanceDevice $device,
        int $schoolId,
        string $rawIdentifier,
        Carbon $punchedAt,
        string $punchType,
        string $verificationMethod,
        array $rawData
    ): array {
        $deviceName = $device ? $device->name : 'External Device';
        $timeStr = $punchedAt->format('h:i:s A');

        $log = AttendanceDeviceLog::create([
            'school_id' => $schoolId,
            'attendance_device_id' => $device?->id,
            'device_identifier' => $device?->device_id ?? ($rawData['device_identifier'] ?? null),
            'raw_identifier' => $rawIdentifier,
            'user_type' => 'user',
            'user_id' => $user->id,
            'student_id' => null,
            'teacher_id' => null,
            'punched_at' => $punchedAt,
            'punch_type' => $punchType,
            'verification_method' => $verificationMethod,
            'status' => 'success',
            'response_message' => "User punch recorded for {$user->name} ({$user->role})",
            'payload_json' => $rawData,
        ]);

        if ($device) {
            $device->update(['last_sync_at' => Carbon::now()]);
        }

        return [
            'status' => 'success',
            'user_type' => 'user',
            'user_id' => $user->id,
            'name' => $user->name,
            'role' => $user->role,
            'attendance_status' => 'Present',
            'punched_at' => $punchedAt->toDateTimeString(),
            'device' => $deviceName,
            'photo_url' => $user->profile_picture_url,
            'message' => "Welcome {$user->name}! Punch recorded at {$timeStr}.",
            'log_id' => $log->id,
        ];
    }
}
