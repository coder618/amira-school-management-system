<?php

use Illuminate\Support\Facades\Route;

// Backend is API only - no Blade views
Route::get('/', function () {
    return response()->json([
        'name' => 'EduCore School Management System API',
        'architecture' => 'REST API Only (No Blade Views)',
        'version' => '1.0.0',
        'status' => 'operational',
        'api_documentation' => [
            'auth' => [
                'POST /api/register',
                'POST /api/login',
                'POST /api/logout',
                'GET /api/user',
            ],
            'dashboard' => [
                'GET /api/dashboard/stats',
            ],
            'resources' => [
                'GET|POST /api/students',
                'GET|PUT|DELETE /api/students/{id}',
                'GET|POST /api/courses',
                'GET|PUT|DELETE /api/courses/{id}',
            ],
        ],
    ]);
});
