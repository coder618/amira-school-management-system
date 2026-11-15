<?php

namespace App\Modules\Attendance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Models\Student;
use App\Modules\Attendance\Models\AttendanceDevice;
use App\Modules\Attendance\Models\AttendanceDeviceLog;
use App\Modules\Attendance\Services\AttendanceDeviceService;
use App\Modules\Core\Enums\Role;
use App\Modules\Core\Models\User;
use App\Modules\HR\Models\Teacher;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AttendanceDeviceController extends Controller
{
    public function __construct(
        protected AttendanceDeviceService $deviceService
    ) {}

    /**
     * List all attendance devices registered for the current school tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        $isSuperAdmin = $user && $user->role === Role::SuperAdmin->value;

        $query = AttendanceDevice::query()
            ->with('school:id,name,code')
            ->withCount(['logs as total_punches'])
            ->withCount(['logs as today_punches' => function ($q) {
                $q->whereDate('punched_at', Carbon::today());
            }])
            ->orderByDesc('id');

        if ($isSuperAdmin && $request->filled('school_id')) {
            $query->where('school_id', $request->query('school_id'));
        } elseif ($isSuperAdmin && $request->boolean('all_tenants')) {
            // Global cross-tenant view for SuperAdmin
        } else {
            $query->forTenant();
        }

        $devices = $query->get();

        return response()->json($devices);
    }

    /**
     * Register a new external attendance device.
     */
    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        $isSuperAdmin = $user && $user->role === Role::SuperAdmin->value;
        $schoolId = ($isSuperAdmin && $request->filled('school_id'))
            ? (int) $request->input('school_id')
            : ($user?->school_id ?? 1);

        $validated = $request->validate([
            'school_id' => 'nullable|exists:schools,id',
            'name' => 'required|string|max:120',
            'device_id' => [
                'required',
                'string',
                'max:80',
                Rule::unique('attendance_devices')->where(fn ($query) => $query->where('school_id', $schoolId)),
            ],
            'device_type' => 'nullable|string|in:rfid,fingerprint,facial,barcode_qr,general',
            'device_model' => 'nullable|string|max:100',
            'ip_address' => 'nullable|string|max:45',
            'location' => 'nullable|string|max:150',
            'status' => 'nullable|string|in:active,inactive,maintenance',
        ]);

        $validated['school_id'] = $schoolId;
        $validated['api_token'] = AttendanceDevice::generateApiToken();
        $validated['device_type'] = $validated['device_type'] ?? 'rfid';
        $validated['status'] = $validated['status'] ?? 'active';

        $device = AttendanceDevice::create($validated);
        $device->load('school:id,name,code');

        return response()->json([
            'message' => 'Attendance device registered successfully.',
            'device' => $device,
        ], 201);
    }

    /**
     * Show details of a device.
     */
    public function show(int $id): JsonResponse
    {
        $device = AttendanceDevice::forTenant()
            ->withCount(['logs as total_punches'])
            ->findOrFail($id);

        return response()->json($device);
    }

    /**
     * Update an existing device.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $device = AttendanceDevice::forTenant()->findOrFail($id);
        $schoolId = $device->school_id;

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:120',
            'device_id' => [
                'sometimes',
                'required',
                'string',
                'max:80',
                Rule::unique('attendance_devices')
                    ->where(fn ($query) => $query->where('school_id', $schoolId))
                    ->ignore($device->id),
            ],
            'device_type' => 'nullable|string|in:rfid,fingerprint,facial,barcode_qr,general',
            'device_model' => 'nullable|string|max:100',
            'ip_address' => 'nullable|string|max:45',
            'location' => 'nullable|string|max:150',
            'status' => 'nullable|string|in:active,inactive,maintenance',
        ]);

        $device->update($validated);

        return response()->json([
            'message' => 'Attendance device updated successfully.',
            'device' => $device->fresh(),
        ]);
    }

    /**
     * Delete an attendance device.
     */
    public function destroy(int $id): JsonResponse
    {
        $device = AttendanceDevice::forTenant()->findOrFail($id);
        $device->delete();

        return response()->json([
            'message' => 'Attendance device removed successfully.',
        ]);
    }

    /**
     * Regenerate device API token.
     */
    public function regenerateToken(int $id): JsonResponse
    {
        $device = AttendanceDevice::forTenant()->findOrFail($id);
        $device->update([
            'api_token' => AttendanceDevice::generateApiToken(),
        ]);

        return response()->json([
            'message' => 'Device API token regenerated successfully.',
            'api_token' => $device->api_token,
            'device' => $device,
        ]);
    }

    /**
     * Public / Device Webhook: Device ping / heartbeat.
     */
    public function ping(Request $request): JsonResponse
    {
        $device = $this->resolveRequestDevice($request);

        if ($device) {
            $device->update(['last_sync_at' => Carbon::now()]);
        }

        return response()->json([
            'status' => 'online',
            'device' => $device?->name ?? 'Unknown / Unregistered',
            'server_time' => Carbon::now()->toIso8601String(),
        ]);
    }

    /**
     * Ingestion Endpoint: Record a single attendance punch from an external device.
     * Accessible either via Device API Token in header (X-Device-Token or Bearer) or user session.
     */
    public function recordPunch(Request $request): JsonResponse
    {
        $device = $this->resolveRequestDevice($request);
        $schoolId = $device?->school_id ?? auth()->user()?->school_id;

        if (! $device && ! $schoolId) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized device. Please supply a valid device API token in X-Device-Token header or payload.',
            ], 401);
        }

        $validated = $request->validate([
            'identifier' => 'nullable|string',
            'card_number' => 'nullable|string',
            'user_code' => 'nullable|string',
            'punched_at' => 'nullable|date',
            'punch_type' => 'nullable|string|in:check_in,check_out,auto',
            'verification_method' => 'nullable|string|in:card,fingerprint,face,barcode_qr,manual,other',
            'device_identifier' => 'nullable|string',
        ]);

        $identifier = $validated['identifier'] ?? $validated['card_number'] ?? $validated['user_code'] ?? null;
        if (empty($identifier)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Identifier (card_number, student_id, or biometric_id) is required.',
            ], 422);
        }

        $result = $this->deviceService->processPunch($validated, $device, $schoolId);

        $httpStatus = ($result['status'] === 'error') ? 400 : 200;
        return response()->json($result, $httpStatus);
    }

    /**
     * Ingestion Endpoint: Batch punches sync from external hardware or sync utility.
     */
    public function bulkPunches(Request $request): JsonResponse
    {
        $device = $this->resolveRequestDevice($request);
        $schoolId = $device?->school_id ?? auth()->user()?->school_id;

        if (! $device && ! $schoolId) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized device. Please supply a valid device API token in X-Device-Token header or payload.',
            ], 401);
        }

        $validated = $request->validate([
            'punches' => 'required|array|min:1',
            'punches.*.identifier' => 'nullable|string',
            'punches.*.card_number' => 'nullable|string',
            'punches.*.user_code' => 'nullable|string',
            'punches.*.punched_at' => 'nullable|date',
            'punches.*.punch_type' => 'nullable|string|in:check_in,check_out,auto',
            'punches.*.verification_method' => 'nullable|string',
        ]);

        $batchResult = $this->deviceService->processBatch($validated['punches'], $device, $schoolId);

        return response()->json($batchResult);
    }

    /**
     * List device punch logs with filters (Authenticated Admin).
     */
    public function logs(Request $request): JsonResponse
    {
        $user = auth()->user();
        $isSuperAdmin = $user && $user->role === Role::SuperAdmin->value;
        $schoolId = ($isSuperAdmin && $request->filled('school_id'))
            ? (int) $request->query('school_id')
            : ($user?->school_id ?? 1);

        $query = AttendanceDeviceLog::with(['device', 'student.classLevel', 'student.section', 'teacher.user', 'user'])
            ->where('school_id', $schoolId)
            ->orderByDesc('punched_at');

        if ($request->filled('date')) {
            $query->whereDate('punched_at', $request->query('date'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('user_type')) {
            $query->where('user_type', $request->query('user_type'));
        }

        if ($request->filled('device_id')) {
            $query->where('attendance_device_id', $request->query('device_id'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('raw_identifier', 'like', "%{$search}%")
                    ->orWhere('response_message', 'like', "%{$search}%")
                    ->orWhereHas('student', function ($sq) use ($search) {
                        $sq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('student_id', 'like', "%{$search}%");
                    })
                    ->orWhereHas('teacher.user', function ($tq) use ($search) {
                        $tq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $logs = $query->paginate($request->query('per_page', 25));

        return response()->json($logs);
    }

    /**
     * Summary statistics for device attendance.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = auth()->user();
        $isSuperAdmin = $user && $user->role === Role::SuperAdmin->value;
        $schoolId = ($isSuperAdmin && $request->filled('school_id'))
            ? (int) $request->query('school_id')
            : ($user?->school_id ?? 1);

        $date = $request->query('date', Carbon::today()->toDateString());

        $totalDevices = AttendanceDevice::where('school_id', $schoolId)->count();
        $activeDevices = AttendanceDevice::where('school_id', $schoolId)->where('status', 'active')->count();

        $todayPunches = AttendanceDeviceLog::where('school_id', $schoolId)
            ->whereDate('punched_at', $date)
            ->count();

        $successPunches = AttendanceDeviceLog::where('school_id', $schoolId)
            ->whereDate('punched_at', $date)
            ->where('status', 'success')
            ->count();

        $unrecognizedPunches = AttendanceDeviceLog::where('school_id', $schoolId)
            ->whereDate('punched_at', $date)
            ->where('status', 'unrecognized')
            ->count();

        $latestLog = AttendanceDeviceLog::with(['device', 'student'])
            ->where('school_id', $schoolId)
            ->orderByDesc('punched_at')
            ->first();

        return response()->json([
            'total_devices' => $totalDevices,
            'active_devices' => $activeDevices,
            'today_punches' => $todayPunches,
            'success_punches' => $successPunches,
            'unrecognized_punches' => $unrecognizedPunches,
            'date' => $date,
            'latest_punch' => $latestLog,
        ]);
    }

    /**
     * Simulate an external device punch from frontend simulator.
     */
    public function simulatePunch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'device_id' => 'nullable|exists:attendance_devices,id',
            'identifier' => 'required|string',
            'punch_type' => 'nullable|string|in:check_in,check_out,auto',
            'verification_method' => 'nullable|string|in:card,fingerprint,face,barcode_qr,manual,other',
        ]);

        $device = null;
        if (! empty($validated['device_id'])) {
            $device = AttendanceDevice::forTenant()->find($validated['device_id']);
        }

        $schoolId = auth()->user()?->school_id ?? 1;
        $result = $this->deviceService->processPunch([
            'identifier' => $validated['identifier'],
            'punch_type' => $validated['punch_type'] ?? 'check_in',
            'verification_method' => $validated['verification_method'] ?? 'card',
            'punched_at' => Carbon::now()->toDateTimeString(),
        ], $device, $schoolId);

        return response()->json($result);
    }

    /**
     * Assign card RFID or Biometric ID to a student, teacher, or user.
     */
    public function assignCard(Request $request): JsonResponse
    {
        $schoolId = auth()->user()?->school_id ?? 1;

        $validated = $request->validate([
            'target_type' => 'required|string|in:student,teacher,user',
            'target_id' => 'required|integer',
            'card_rfid' => 'nullable|string|max:100',
            'biometric_id' => 'nullable|string|max:100',
        ]);

        if (empty($validated['card_rfid']) && empty($validated['biometric_id'])) {
            return response()->json([
                'message' => 'Please provide at least a Card RFID or Biometric ID to assign.',
            ], 422);
        }

        $type = $validated['target_type'];
        $targetId = $validated['target_id'];
        $cardRfid = $validated['card_rfid'] ?? null;
        $biometricId = $validated['biometric_id'] ?? null;

        $updateData = [];
        if ($cardRfid !== null) {
            $updateData['card_rfid'] = $cardRfid;
        }
        if ($biometricId !== null) {
            $updateData['biometric_id'] = $biometricId;
        }

        if ($type === 'student') {
            $student = Student::where('school_id', $schoolId)->findOrFail($targetId);
            $student->update($updateData);

            return response()->json([
                'message' => "Assigned card/biometric ID to student {$student->full_name}.",
                'target' => $student,
            ]);
        }

        if ($type === 'teacher') {
            $teacher = Teacher::where('school_id', $schoolId)->findOrFail($targetId);
            $teacher->update($updateData);

            return response()->json([
                'message' => "Assigned card/biometric ID to teacher {$teacher->employee_id}.",
                'target' => $teacher,
            ]);
        }

        $user = User::where('school_id', $schoolId)->findOrFail($targetId);
        $user->update(['card_rfid' => $cardRfid]);

        return response()->json([
            'message' => "Assigned card RFID to user {$user->name}.",
            'target' => $user,
        ]);
    }

    /**
     * Helper to resolve the device from request headers or body.
     */
    protected function resolveRequestDevice(Request $request): ?AttendanceDevice
    {
        // 1. Check X-Device-Token Header
        $token = $request->header('X-Device-Token');

        // 2. Check Bearer Token
        if (empty($token) && $request->bearerToken() && str_starts_with($request->bearerToken(), 'adt_')) {
            $token = $request->bearerToken();
        }

        // 3. Check query/body token
        if (empty($token)) {
            $token = $request->input('api_token') ?? $request->input('device_token');
        }

        $deviceIdentifier = $request->header('X-Device-Id') ?? $request->input('device_identifier');
        $schoolId = $request->header('X-School-Id') ? (int) $request->header('X-School-Id') : null;

        return $this->deviceService->resolveDevice($token, $deviceIdentifier, $schoolId);
    }
}
