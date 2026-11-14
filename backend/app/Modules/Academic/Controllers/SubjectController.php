<?php

namespace App\Modules\Academic\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Subject::with('classLevel')->forTenant();

        if ($request->filled('class_level_id')) {
            $query->where('class_level_id', $request->query('class_level_id'));
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'class_level_id' => 'required|exists:class_levels,id',
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:20',
            'full_mark' => 'nullable|numeric',
            'pass_mark' => 'nullable|numeric',
            'is_optional' => 'nullable|boolean',
            'can_be_4th_subject' => 'nullable|boolean',
        ]);

        $subject = Subject::create($validated);

        return response()->json($subject, 201);
    }
}

