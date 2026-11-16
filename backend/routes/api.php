<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Modules\Academic\Controllers\SectionController;
use App\Modules\Academic\Controllers\ShiftController;
use App\Modules\Academic\Controllers\StudentController;
use App\Modules\Academic\Controllers\SubjectController;
use App\Modules\Academic\Controllers\TeacherNoteController;
use App\Modules\Attendance\Controllers\AttendanceController;
use App\Modules\Attendance\Controllers\AttendanceDeviceController;
use App\Modules\Attendance\Controllers\HolidayController;
use App\Modules\Attendance\Controllers\MultiTenantAttendanceDeviceController;
use App\Modules\Core\Controllers\SchoolController;
use App\Modules\Documents\Controllers\DocumentController;
use App\Modules\FundCollectionName\Controllers\FundCollectionNameController;
use App\Modules\HR\Controllers\TeacherController;
use App\Modules\Invoice\Controllers\InvoiceController;
use App\Modules\Library\Controllers\BookController;
use App\Modules\Library\Controllers\BookIssueController;
use App\Modules\Media\Controllers\MediaController;
use App\Modules\Notification\Controllers\NotificationController;
use App\Modules\Payments\Controllers\PaymentController;
use App\Modules\SchoolClass\Controllers\ClassLevelController;
use App\Modules\SchoolExamResults\Controllers\ExamResultController as SchoolExamResultController;
use App\Modules\SchoolExams\Controllers\ExamController as SchoolExamController;
use Illuminate\Support\Facades\Route;

// Health / meta check
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'timestamp' => now()->toIso8601String(),
        'service' => 'EduCore Laravel API',
    ]);
});

// Authentication routes (Public)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->name('login');

// External Hardware Attendance Device Ingestion (Authenticated via X-Device-Token or device API token)
Route::prefix('attendance/device')->group(function () {
    Route::post('/punch', [AttendanceDeviceController::class, 'recordPunch']);
    Route::post('/record', [AttendanceDeviceController::class, 'recordPunch']);
    Route::post('/bulk-punches', [AttendanceDeviceController::class, 'bulkPunches']);
    Route::get('/ping', [AttendanceDeviceController::class, 'ping']);
    Route::post('/ping', [AttendanceDeviceController::class, 'ping']);
});

// Protected routes (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    // Current user & session
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/users', [AuthController::class, 'index']);
    Route::get('/users/{id}', [AuthController::class, 'show']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/user/profile-picture', [AuthController::class, 'updateProfilePicture']);
    Route::delete('/user/profile-picture', [AuthController::class, 'deleteProfilePicture']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);

    // Dashboard metrics
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // School Tenant Institutional Settings
    Route::get('/school/current', [SchoolController::class, 'showCurrent']);
    Route::put('/school/current', [SchoolController::class, 'updateCurrent']);
    Route::get('/schools/{school}', [SchoolController::class, 'show']);
    Route::put('/schools/{school}', [SchoolController::class, 'update']);

    // SuperAdmin Only Routes (Core Tenant School Management & Multi-Tenant Devices)
    Route::middleware('super_admin')->group(function () {
        Route::get('/schools', [SchoolController::class, 'index']);
        Route::post('/schools', [SchoolController::class, 'store']);

        // Multi-Tenant Attendance Device Management Module
        Route::get('/super-admin/attendance/devices', [MultiTenantAttendanceDeviceController::class, 'index']);
        Route::post('/super-admin/attendance/devices', [MultiTenantAttendanceDeviceController::class, 'store']);
        Route::get('/super-admin/attendance/devices/stats', [MultiTenantAttendanceDeviceController::class, 'stats']);
        Route::get('/super-admin/attendance/devices/logs', [MultiTenantAttendanceDeviceController::class, 'logs']);
    });

    // 1. Academic Module (SIS) APIs
    Route::get('/students/{student}/full-summary', [StudentController::class, 'fullSummary']);
    Route::get('/students/{student}/attendance-history', [AttendanceController::class, 'studentHistory']);
    Route::get('/students/{student}/teacher-notes', [TeacherNoteController::class, 'index']);
    Route::post('/students/{student}/teacher-notes', [TeacherNoteController::class, 'store']);
    Route::delete('/students/{student}/teacher-notes/{note}', [TeacherNoteController::class, 'destroy']);
    Route::apiResource('students', StudentController::class);
    Route::apiResource('class-levels', ClassLevelController::class);
    Route::apiResource('sections', SectionController::class)->only(['index', 'store', 'destroy']);
    Route::apiResource('shifts', ShiftController::class)->only(['index', 'store']);

    // 1.1 Media Module (Tenant-isolated File & Image Storage)
    Route::get('/media', [MediaController::class, 'index']);
    Route::post('/media/upload', [MediaController::class, 'upload']);
    Route::delete('/media/{media}', [MediaController::class, 'destroy']);

    // 1.2 Documents Module (Tenant-scoped Document Management via Media Module)
    Route::get('/documents/stats', [DocumentController::class, 'stats']);
    Route::get('/documents/{document}/download', [DocumentController::class, 'download']);
    Route::apiResource('documents', DocumentController::class)->parameters(['documents' => 'document']);

    // 2. HR Module (Teachers) APIs
    Route::get('/teachers/{teacher}/full-summary', [TeacherController::class, 'fullSummary']);
    Route::apiResource('teachers', TeacherController::class);

    // 3. Attendance Module APIs
    Route::get('/attendances', [AttendanceController::class, 'index']);
    Route::post('/attendances/bulk-upsert', [AttendanceController::class, 'bulkUpsert']);
    Route::get('/attendances/stats', [AttendanceController::class, 'stats']);

    // 3.1 External Attendance Devices Management & Telemetry
    Route::get('/attendance/device/user-punches', [AttendanceDeviceController::class, 'userPunches']);
    Route::apiResource('attendance/devices', AttendanceDeviceController::class)->parameters(['devices' => 'device']);
    Route::post('/attendance/devices/{device}/regenerate-token', [AttendanceDeviceController::class, 'regenerateToken']);
    Route::get('/attendance/device-logs', [AttendanceDeviceController::class, 'logs']);
    Route::get('/attendance/device-stats', [AttendanceDeviceController::class, 'stats']);
    Route::post('/attendance/device/simulate', [AttendanceDeviceController::class, 'simulatePunch']);
    Route::post('/attendance/device/assign-card', [AttendanceDeviceController::class, 'assignCard']);

    // 3.2 Holiday Calendar Module APIs
    Route::get('/attendance/holidays/check', [HolidayController::class, 'checkDate']);
    Route::apiResource('attendance/holidays', HolidayController::class)->parameters(['holidays' => 'holiday'])->whereNumber('holiday');

    // 4. FundCollectionName & Payments Modules (Tenant Fees & Collections)
    Route::apiResource('fund-collection-names', FundCollectionNameController::class)->parameters(['fund-collection-names' => 'fundCollectionName']);
    Route::get('/fee-categories', [FundCollectionNameController::class, 'index']); // backward compatibility alias
    Route::apiResource('payments', PaymentController::class)->parameters(['payments' => 'payment']);
    Route::post('/payments/{payment}/settle', [PaymentController::class, 'settle']);
    Route::get('/payments/{payment}/pdf', [PaymentController::class, 'downloadPdf']);
    Route::get('/payments-stats', [PaymentController::class, 'stats']);

    // 4.1 Invoices Module (User Invoices, Status Tracking, Online/Offline Payment & Payment Record Generation)
    Route::get('/invoices/stats', [InvoiceController::class, 'stats']);
    Route::get('/invoices-stats', [InvoiceController::class, 'stats']);
    Route::post('/invoices/{invoice}/pay', [InvoiceController::class, 'pay']);
    Route::apiResource('invoices', InvoiceController::class)->parameters(['invoices' => 'invoice']);

    // 5. Academic Subjects APIs
    Route::apiResource('subjects', SubjectController::class)->parameters(['subjects' => 'subject']);

    // Legacy Aliases for Exams and Exam Marks (routing to SchoolExams & SchoolExamResults)
    Route::get('/exams', [SchoolExamController::class, 'index']);
    Route::post('/exams', [SchoolExamController::class, 'store']);
    Route::get('/exam-marks', [SchoolExamResultController::class, 'index']);
    Route::post('/exam-marks/bulk', [SchoolExamResultController::class, 'bulkStore']);
    Route::get('/report-cards/{studentId}/exam/{examId}', [SchoolExamResultController::class, 'reportCard']);
    Route::get('/report-cards/{studentId}/exam/{examId}/pdf', [SchoolExamResultController::class, 'downloadPdf']);

    // 6. SchoolExams Module (Tenant-scoped Exam Management)
    Route::apiResource('school-exams', SchoolExamController::class)->parameters(['school-exams' => 'exam']);
    Route::patch('/school-exams/{exam}/publish', [SchoolExamController::class, 'togglePublish']);

    // 7. SchoolExamResults Module (Tenant-scoped Marks, Results & Tabulation)
    Route::post('/school-exam-results/student-result', [SchoolExamResultController::class, 'saveStudentResult']);
    Route::apiResource('school-exam-results', SchoolExamResultController::class)->parameters(['school-exam-results' => 'examResult']);
    Route::post('/school-exam-results/bulk', [SchoolExamResultController::class, 'bulkStore']);
    Route::get('/school-exam-results/report-card/{studentId}/exam/{examId}', [SchoolExamResultController::class, 'reportCard']);
    Route::get('/school-exam-results/report-card/{studentId}/exam/{examId}/pdf', [SchoolExamResultController::class, 'downloadPdf']);
    Route::get('/school-exam-results/tabulation/{examId}/class/{classLevelId}', [SchoolExamResultController::class, 'tabulationSheet']);

    // 8. User Notifications Module (Read, Unread, Soft Delete, Restore)
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications', [NotificationController::class, 'store']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/trash/empty', [NotificationController::class, 'emptyTrash']);
    Route::get('/notifications/{notification}', [NotificationController::class, 'show']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('/notifications/{notification}/unread', [NotificationController::class, 'markAsUnread']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']); // Soft delete
    Route::post('/notifications/{id}/restore', [NotificationController::class, 'restore']);
    Route::delete('/notifications/{id}/force', [NotificationController::class, 'forceDestroy']);

    // 9. Library Module (Books, Stock Inventory & Book Issues)
    Route::get('/library/stats', [BookController::class, 'stats']);
    Route::get('/library/categories', [BookController::class, 'categories']);
    Route::apiResource('library/books', BookController::class)->parameters(['books' => 'book']);
    Route::get('/library/issues', [BookIssueController::class, 'index']);
    Route::post('/library/issues', [BookIssueController::class, 'store']);
    Route::get('/library/issues/{issue}', [BookIssueController::class, 'show']);
    Route::post('/library/issues/{issue}/return', [BookIssueController::class, 'returnBook']);
    Route::delete('/library/issues/{issue}', [BookIssueController::class, 'destroy']);
});
