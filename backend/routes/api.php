<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Modules\Academic\Controllers\SectionController;
use App\Modules\Academic\Controllers\ShiftController;
use App\Modules\Academic\Controllers\StudentController;
use App\Modules\Academic\Controllers\SubjectController;
use App\Modules\Attendance\Controllers\AttendanceController;
use App\Modules\Core\Controllers\SchoolController;
use App\Modules\FundCollectionName\Controllers\FundCollectionNameController;
use App\Modules\HR\Controllers\TeacherController;
use App\Modules\Invoice\Controllers\InvoiceController;
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

    // SuperAdmin Only Routes (Core Tenant School Management)
    Route::middleware('super_admin')->group(function () {
        Route::get('/schools', [SchoolController::class, 'index']);
        Route::post('/schools', [SchoolController::class, 'store']);
    });

    // 1. Academic Module (SIS) APIs
    Route::apiResource('students', StudentController::class);
    Route::apiResource('class-levels', ClassLevelController::class);
    Route::apiResource('sections', SectionController::class)->only(['index', 'store', 'destroy']);
    Route::apiResource('shifts', ShiftController::class)->only(['index', 'store']);

    // 1.1 Media Module (Tenant-isolated File & Image Storage)
    Route::get('/media', [MediaController::class, 'index']);
    Route::post('/media/upload', [MediaController::class, 'upload']);
    Route::delete('/media/{media}', [MediaController::class, 'destroy']);

    // 2. HR Module (Teachers) APIs
    Route::apiResource('teachers', TeacherController::class);

    // 3. Attendance Module APIs
    Route::get('/attendances', [AttendanceController::class, 'index']);
    Route::post('/attendances/bulk-upsert', [AttendanceController::class, 'bulkUpsert']);
    Route::get('/attendances/stats', [AttendanceController::class, 'stats']);

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
});
