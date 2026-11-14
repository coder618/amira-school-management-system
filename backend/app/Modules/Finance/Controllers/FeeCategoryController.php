<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Models\FeeCategory;
use Illuminate\Http\JsonResponse;

class FeeCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = FeeCategory::forTenant()->get();

        return response()->json($categories);
    }
}

