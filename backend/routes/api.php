<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Modules\Academic\Controllers\SectionController;
use App\Modules\Academic\Controllers\ShiftController;
use App\Modules\Academic\Controllers\StudentController;
use App\Modules\Attendance\Controllers\AttendanceController;
use App\Modules\Core\Controllers\SchoolController;
use App\Modules\Exam\Controllers\ExamController;
use App\Modules\Exam\Controllers\ExamMarkController;
use App\Modules\Exam\Controllers\SubjectController;
use App\Modules\Finance\Controllers\FeeCategoryController;
use App\Modules\Finance\Controllers\InvoiceController;
use App\Modules\Finance\Controllers\PaymentController;
use App\Modules\HR\Controllers\TeacherController;
use App\Modules\SchoolClass\Controllers\ClassLevelController;
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
Route::post('/login', [AuthController::class, 'login']);

// Protected routes (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    // Current user & session
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Dashboard metrics
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

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

    // 2. HR Module (Teachers) APIs
    Route::apiResource('teachers', TeacherController::class);

    // 3. Attendance Module APIs
    Route::get('/attendances', [AttendanceController::class, 'index']);
    Route::post('/attendances/bulk-upsert', [AttendanceController::class, 'bulkUpsert']);
    Route::get('/attendances/stats', [AttendanceController::class, 'stats']);

    // 4. Finance Module APIs
    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::post('/invoices', [InvoiceController::class, 'store']);
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::get('/fee-categories', [FeeCategoryController::class, 'index']);

    // 5. Examination Module (NCTB Grading) APIs
    Route::get('/exams', [ExamController::class, 'index']);
    Route::post('/exams', [ExamController::class, 'store']);
    Route::get('/subjects', [SubjectController::class, 'index']);
    Route::post('/subjects', [SubjectController::class, 'store']);
    Route::get('/exam-marks', [ExamMarkController::class, 'index']);
    Route::post('/exam-marks/bulk', [ExamMarkController::class, 'bulkStore']);
    Route::get('/report-cards/{studentId}/exam/{examId}', [ExamMarkController::class, 'reportCard']);
});
