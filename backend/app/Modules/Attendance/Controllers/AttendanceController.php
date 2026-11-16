<?php

namespace App\Modules\Attendance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Models\Student;
use App\Modules\Attendance\Events\AttendanceMarked;
use App\Modules\Attendance\Models\Attendance;
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

