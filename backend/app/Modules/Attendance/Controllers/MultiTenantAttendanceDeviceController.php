<?php

namespace App\Modules\Attendance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Attendance\Models\AttendanceDevice;
use App\Modules\Attendance\Models\AttendanceDeviceLog;
use App\Modules\Core\Models\School;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MultiTenantAttendanceDeviceController extends Controller
{
    /**
     * List attendance devices across all school tenants.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AttendanceDevice::with('school:id,name,code,board,address,phone')
            ->withCount(['logs as total_punches'])
            ->withCount(['logs as today_punches' => function ($q) {
                $q->whereDate('punched_at', Carbon::today());
            }])
            ->orderByDesc('id');

        if ($request->filled('school_id')) {
            $query->where('school_id', $request->query('school_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('device_type')) {
            $query->where('device_type', $request->query('device_type'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('device_id', 'like', "%{$search}%")
                    ->orWhere('device_model', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhereHas('school', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%");
                    });
            });
        }

        $devices = $query->paginate($request->query('per_page', 25));

        return response()->json($devices);
    }

    /**
     * Cross-tenant device telemetry statistics.
     */
    public function stats(): JsonResponse
    {
        $today = Carbon::today()->toDateString();

        $totalDevices = AttendanceDevice::count();
        $activeDevices = AttendanceDevice::where('status', 'active')->count();

        $schoolsWithDevices = AttendanceDevice::distinct('school_id')->count('school_id');
        $totalSchools = School::where('is_active', true)->count();

        $todayPunchesAllSchools = AttendanceDeviceLog::whereDate('punched_at', $today)->count();
        $successPunchesAllSchools = AttendanceDeviceLog::whereDate('punched_at', $today)
            ->where('status', 'success')
            ->count();
        $unrecognizedPunchesAllSchools = AttendanceDeviceLog::whereDate('punched_at', $today)
            ->where('status', 'unrecognized')
            ->count();

        $devicesByType = AttendanceDevice::selectRaw('device_type, count(*) as count')
            ->groupBy('device_type')
            ->pluck('count', 'device_type');

        return response()->json([
            'total_devices' => $totalDevices,
            'active_devices' => $activeDevices,
            'schools_with_devices' => $schoolsWithDevices,
            'total_schools' => $totalSchools,
            'today_punches' => $todayPunchesAllSchools,
            'success_punches' => $successPunchesAllSchools,
            'unrecognized_punches' => $unrecognizedPunchesAllSchools,
            'devices_by_type' => $devicesByType,
            'date' => $today,
        ]);
    }

    /**
     * Register a new external attendance device for any specific school tenant.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school_id' => 'required|exists:schools,id',
            'name' => 'required|string|max:120',
            'device_id' => [
                'required',
                'string',
                'max:80',
                Rule::unique('attendance_devices')->where(fn ($query) => $query->where('school_id', $request->input('school_id'))),
            ],
            'device_type' => 'nullable|string|in:rfid,fingerprint,facial,barcode_qr,general',
            'device_model' => 'nullable|string|max:100',
            'ip_address' => 'nullable|string|max:45',
            'location' => 'nullable|string|max:150',
            'status' => 'nullable|string|in:active,inactive,maintenance',
        ]);

        $validated['api_token'] = AttendanceDevice::generateApiToken();
        $validated['device_type'] = $validated['device_type'] ?? 'rfid';
        $validated['status'] = $validated['status'] ?? 'active';

        $device = AttendanceDevice::create($validated);
        $device->load('school:id,name,code');

        return response()->json([
            'message' => "Attendance device registered successfully for tenant school {$device->school?->name}.",
            'device' => $device,
        ], 201);
    }

    /**
     * Cross-tenant device punch logs.
     */
    public function logs(Request $request): JsonResponse
    {
        $query = AttendanceDeviceLog::with([
            'school:id,name,code',
            'device',
            'student.classLevel',
            'student.section',
            'teacher.user',
            'user',
        ])->orderByDesc('punched_at');

        if ($request->filled('school_id')) {
            $query->where('school_id', $request->query('school_id'));
        }

        if ($request->filled('date')) {
            $query->whereDate('punched_at', $request->query('date'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('raw_identifier', 'like', "%{$search}%")
                    ->orWhere('response_message', 'like', "%{$search}%")
                    ->orWhereHas('school', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%");
                    })
                    ->orWhereHas('student', function ($sq) use ($search) {
                        $sq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('student_id', 'like', "%{$search}%");
                    });
            });
        }

        $logs = $query->paginate($request->query('per_page', 25));

        return response()->json($logs);
    }
}
