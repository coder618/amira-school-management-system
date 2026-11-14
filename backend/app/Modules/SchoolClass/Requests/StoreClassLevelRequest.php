<?php

namespace App\Modules\SchoolClass\Requests;

use App\Modules\Core\Models\School;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClassLevelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $schoolId = auth()->user()?->school_id
            ?? ($this->header('X-School-Id') ? (int) $this->header('X-School-Id') : null)
            ?? School::first()?->id;

        return [
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('class_levels', 'name')->where(function ($query) use ($schoolId) {
                    return $query->where('school_id', $schoolId);
                }),
            ],
            'numeric_value' => 'nullable|integer|min:0|max:100',
            'code' => 'nullable|string|max:20',
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'A class named ":input" already exists in this school.',
        ];
    }
}

