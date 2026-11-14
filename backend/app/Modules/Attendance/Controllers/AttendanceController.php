<?php

namespace App\Modules\Attendance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Attendance\Events\AttendanceMarked;
use App\Modules\Attendance\Models\Attendance;
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

        return response()->json([
            'total' => $total,
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'percentage' => $percentage,
        ]);
    }
}

