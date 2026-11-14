<?php

namespace App\Modules\Academic\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    public function index(): JsonResponse
    {
        $shifts = Shift::forTenant()->get();

        return response()->json($shifts);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'start_time' => 'nullable|string',
            'end_time' => 'nullable|string',
        ]);

        $shift = Shift::create($validated);

        return response()->json($shift, 201);
    }
}

