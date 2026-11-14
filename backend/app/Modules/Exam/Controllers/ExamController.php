<?php

namespace App\Modules\Exam\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Exam\Models\Exam;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    public function index(): JsonResponse
    {
        $exams = Exam::forTenant()->orderBy('id', 'desc')->get();

        return response()->json($exams);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'term' => 'required|string|max:50',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $exam = Exam::create($validated);

        return response()->json($exam, 201);
    }
}

