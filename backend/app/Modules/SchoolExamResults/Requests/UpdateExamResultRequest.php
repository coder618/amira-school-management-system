<?php

namespace App\Modules\SchoolExamResults\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExamResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'mark' => 'nullable|numeric|min:0|max:100',
            'total_mark' => 'nullable|numeric|min:0|max:100',
            'subjective_mark' => 'nullable|numeric|min:0|max:100',
            'objective_mark' => 'nullable|numeric|min:0|max:100',
            'practical_mark' => 'nullable|numeric|min:0|max:100',
            'is_4th_subject' => 'nullable|boolean',
            'note' => 'nullable|string|max:1000',
        ];
    }
}

