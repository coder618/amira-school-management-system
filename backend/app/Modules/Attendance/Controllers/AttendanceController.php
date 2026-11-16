<?php

namespace App\Modules\Attendance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Models\Student;
use App\Modules\Attendance\Events\AttendanceMarked;
use App\Modules\Attendance\Models\Attendance;
use App\Modules\Attendance\Models\AttendanceDeviceLog;
use App\Modules\Attendance\Models\Holiday;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttendanceController extends Controller
{
    /**
     * Retrieve attendance list for a specific section and date.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'section_id' => 'required|exists:sections,id',
            'date' => 'required|date',
        ]);

        $attendances = Attendance::with('student')
            ->forTenant()
            ->where('section_id', $request->query('section_id'))
            ->where('date', $request->query('date'))
            ->get();

        $studentIds = $attendances->pluck('student_id')->filter()->unique();
        $date = $request->query('date');

        // Look up all device punch records for these students on this date
        $deviceLogs = AttendanceDeviceLog::whereIn('student_id', $studentIds)
            ->whereDate('punched_at', $date)
            ->where('status', 'success')
            ->orderBy('punched_at', 'asc')
            ->get()
            ->groupBy('student_id');

        foreach ($attendances as $att) {
            $logs = $deviceLogs->get($att->student_id);
            if ($logs && $logs->count() > 0) {
                // First punch of the day as In Time
                $firstLog = $logs->first();
                $att->in_time = Carbon::parse($firstLog->punched_at)->format('H:i:s');
                $att->in_time_formatted = Carbon::parse($firstLog->punched_at)->format('h:i A');

                // Last punch of the day as Out Time (if multiple punches exist)
                if ($logs->count() > 1) {
                    $lastLog = $logs->last();
                    $att->out_time = Carbon::parse($lastLog->punched_at)->format('H:i:s');
                    $att->out_time_formatted = Carbon::parse($lastLog->punched_at)->format('h:i A');
                } else {
                    $att->out_time = null;
                    $att->out_time_formatted = null;
                }
                $att->punch_count = $logs->count();
                $att->punches = $logs->map(fn ($l) => Carbon::parse($l->punched_at)->format('h:i:s A'))->values();
            } else {
                $att->in_time_formatted = $att->in_time ? Carbon::parse($att->in_time)->format('h:i A') : null;
                $att->out_time_formatted = $att->out_time ? Carbon::parse($att->out_time)->format('h:i A') : null;
                $att->punch_count = $att->in_time ? 1 : 0;
                $att->punches = [];
            }
        }

        return response()->json($attendances);
    }

    /**
     * Rapid Bulk Upsert for teachers.
     */
    public function bulkUpsert(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'section_id' => 'required|exists:sections,id',
            'date' => 'required|date',
            'attendances' => 'required|array',
            'attendances.*.student_id' => 'required|exists:students,id',
            'attendances.*.status' => 'required|in:Present,Absent,Late',
            'attendances.*.remarks' => 'nullable|string|max:255',
            'send_absent_sms' => 'nullable|boolean',
        ]);

        $sectionId = $validated['section_id'];
        $date = $validated['date'];
        $schoolId = auth()->user()->school_id ?? 1;
        $academicYearId = (int) ($request->header('X-Academic-Year-Id') ?? 1);
        $sendSms = (bool) ($validated['send_absent_sms'] ?? true);

        $savedRecords = [];

        DB::transaction(function () use ($validated, $sectionId, $date, $schoolId, $academicYearId, &$savedRecords) {
            foreach ($validated['attendances'] as $item) {
                $record = Attendance::updateOrCreate(
                    [
                        'school_id' => $schoolId,
                        'academic_year_id' => $academicYearId,
                        'student_id' => $item['student_id'],
                        'date' => $date,
                    ],
                    [
                        'section_id' => $sectionId,
                        'status' => $item['status'],
                        'remarks' => $item['remarks'] ?? null,
                    ]
                );

                $record->load('student.school');
                $savedRecords[] = $record;
            }
        });

        // Trigger Absent SMS notification event
        event(new AttendanceMarked($savedRecords, $date, $sendSms));

        return response()->json([
            'message' => 'Attendance recorded successfully for ' . count($savedRecords) . ' students.',
            'count' => count($savedRecords),
            'date' => $date,
            'sms_dispatched' => $sendSms,
        ]);
    }

    /**
     * Get aggregate statistics for section attendance on a given date.
     */
    public function stats(Request $request): JsonResponse
    {
        $request->validate([
            'section_id' => 'required|exists:sections,id',
            'date' => 'required|date',
        ]);

        $attendances = Attendance::where('section_id', $request->query('section_id'))
            ->where('date', $request->query('date'))
            ->get();

        $total = $attendances->count();
        $present = $attendances->where('status', 'Present')->count();
        $absent = $attendances->where('status', 'Absent')->count();
        $late = $attendances->where('status', 'Late')->count();
        $percentage = $total > 0 ? round(($present / $total) * 100, 1) : 0.0;

        $holiday = Holiday::forTenant()
            ->onDate($request->query('date'))
            ->first();

        return response()->json([
            'total' => $total,
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'percentage' => $percentage,
            'is_holiday' => $holiday !== null,
            'holiday' => $holiday ? [
                'id' => $holiday->id,
                'title' => $holiday->title,
                'type' => $holiday->type,
                'date' => $holiday->date,
                'end_date' => $holiday->end_date,
                'description' => $holiday->description,
            ] : null,
        ]);
    }

    /**
     * Get the student's attendance history for the last N calendar days (default 10).
     * If not recorded as Present, marks as Absent while respecting the holiday calendar.
     */
    public function studentHistory(Request $request, Student $student): JsonResponse
    {
        $schoolId = auth()->user()?->school_id
            ?? ($request->header('X-School-Id') ? (int) $request->header('X-School-Id') : null)
            ?? $student->school_id;

        if ($schoolId && $student->school_id !== $schoolId && ! (auth()->user()?->isSuperAdmin() ?? false)) {
            return response()->json(['message' => 'Unauthorized access to student record.'], 403);
        }

        $days = (int) ($request->query('days', 10));
        if ($days < 1 || $days > 60) {
            $days = 10;
        }

        $today = Carbon::today();
        $startDate = $today->copy()->subDays($days - 1)->toDateString();
        $endDate = $today->toDateString();

        // 1. Fetch recorded attendances for student in range
        $attendances = Attendance::where('student_id', $student->id)
            ->whereBetween('date', [$startDate, $endDate])
            ->get()
            ->keyBy(function ($item) {
                return Carbon::parse($item->date)->toDateString();
            });

        // 2. Fetch holidays covering this range for the student's school tenant
        $holidays = Holiday::forTenant($student->school_id)
            ->where(function ($q) use ($startDate, $endDate) {
                $q->whereBetween('date', [$startDate, $endDate])
                    ->orWhere(function ($sub) use ($startDate, $endDate) {
                        $sub->whereNotNull('end_date')
                            ->where('date', '<=', $endDate)
                            ->where('end_date', '>=', $startDate);
                    });
            })
            ->get();

        // 3. Fetch device logs to accurately resolve First Punch (In Time) & Last Punch (Out Time)
        $deviceLogs = AttendanceDeviceLog::where('student_id', $student->id)
            ->whereDate('punched_at', '>=', $startDate)
            ->whereDate('punched_at', '<=', $endDate)
            ->where('status', 'success')
            ->orderBy('punched_at', 'asc')
            ->get()
            ->groupBy(fn ($log) => Carbon::parse($log->punched_at)->toDateString());

        $history = [];

        for ($i = 0; $i < $days; $i++) {
            $currentDateObj = $today->copy()->subDays($i);
            $dateStr = $currentDateObj->toDateString();
            $dayOfWeek = $currentDateObj->format('l');

            // Find holiday for this date if any
            $holiday = $holidays->first(function ($h) use ($dateStr) {
                $hStart = Carbon::parse($h->date)->toDateString();
                $hEnd = $h->end_date ? Carbon::parse($h->end_date)->toDateString() : $hStart;
                return $dateStr >= $hStart && $dateStr <= $hEnd;
            });

            $att = $attendances->get($dateStr);
            $dayLogs = $deviceLogs->get($dateStr);
            $inTime = null;
            $outTime = null;

            if ($dayLogs && $dayLogs->count() > 0) {
                // First punch counts as In Time
                $firstPunch = $dayLogs->first();
                $inTime = Carbon::parse($firstPunch->punched_at)->format('h:i A');

                // If multiple punches exist, last punch counts as Out Time
                if ($dayLogs->count() > 1) {
                    $lastPunch = $dayLogs->last();
                    $outTime = Carbon::parse($lastPunch->punched_at)->format('h:i A');
                }
            } elseif ($att && ($att->in_time || $att->out_time)) {
                $inTime = $att->in_time ? Carbon::parse($att->in_time)->format('h:i A') : null;
                $outTime = $att->out_time ? Carbon::parse($att->out_time)->format('h:i A') : null;
            } elseif ($att && $att->status === 'Present') {
                if (preg_match('/at (\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/i', $att->remarks ?? '', $matches)) {
                    $inTime = Carbon::parse($matches[1])->format('h:i A');
                }
            }

            if ($holiday) {
                $status = 'Holiday';
                $remarks = $holiday->title . ($holiday->type ? " ({$holiday->type})" : '');
            } elseif ($att) {
                $status = $att->status; // 'Present', 'Absent', 'Late'
                $remarks = $att->remarks ?: 'Recorded in class attendance';
            } else {
                // If not present and not a holiday, mark it Absent
                $status = 'Absent';
                $remarks = 'Unmarked (Recorded as Absent)';
            }

            $history[] = [
                'date' => $dateStr,
                'day' => $dayOfWeek,
                'status' => $status,
                'in_time' => $inTime,
                'out_time' => $outTime,
                'remarks' => $remarks,
                'is_holiday' => $holiday !== null,
                'holiday' => $holiday ? [
                    'id' => $holiday->id,
                    'title' => $holiday->title,
                    'type' => $holiday->type,
                ] : null,
                'attendance_id' => $att?->id,
            ];
        }

        return response()->json([
            'student_id' => $student->id,
            'days' => $days,
            'data' => $history,
            'summary' => [
                'total' => $days,
                'present' => collect($history)->where('status', 'Present')->count(),
                'absent' => collect($history)->where('status', 'Absent')->count(),
                'late' => collect($history)->where('status', 'Late')->count(),
                'holiday' => collect($history)->where('status', 'Holiday')->count(),
            ],
        ]);
    }
}

