<?php

namespace App\Modules\HR\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTeacherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:150',
            'employee_id' => 'sometimes|required|string|max:50',
            'designation' => 'sometimes|required|string|max:100',
            'department' => 'nullable|string|max:100',
            'qualification' => 'nullable|string|max:150',
            'phone_number' => ['nullable', 'string', 'regex:/^01[3-9]\d{8}$/'],
            'joining_date' => 'nullable|date',
        ];
    }

    public function messages(): array
    {
        return [
            'phone_number.regex' => 'The phone number must be a valid 11-digit Bangladeshi mobile number (e.g. 01712345678).',
        ];
    }
}

