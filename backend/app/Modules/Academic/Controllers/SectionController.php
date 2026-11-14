<?php

namespace App\Modules\Academic\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Section::with(['classLevel', 'classTeacher'])->forTenant();

        if ($request->filled('class_level_id')) {
            $query->where('class_level_id', $request->query('class_level_id'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'class_level_id' => 'required|exists:class_levels,id',
            'class_teacher_id' => 'nullable|exists:teachers,id',
            'name' => 'required|string|max:50',
            'capacity' => 'required|integer|min:1',
        ]);

        $section = Section::create($validated);

        return response()->json($section, 201);
    }

    public function destroy(Section $section): JsonResponse
    {
        $section->delete();

        return response()->json(['message' => 'Section deleted']);
    }
}

