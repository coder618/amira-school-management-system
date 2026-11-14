<?php

namespace App\Modules\SchoolClass\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClassLevelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $classLevel = $this->route('class_level');
        $schoolId = is_object($classLevel) ? $classLevel->school_id : auth()->user()?->school_id;
        $classId = is_object($classLevel) ? $classLevel->id : $classLevel;

        return [
            'name' => [
                'required',
                'string',
                'max:50',
                Rule::unique('class_levels', 'name')
                    ->where(function ($query) use ($schoolId) {
                        return $query->where('school_id', $schoolId);
                    })
                    ->ignore($classId),
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

