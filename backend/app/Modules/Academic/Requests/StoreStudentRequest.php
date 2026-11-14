<?php

namespace App\Modules\Academic\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $imageRule = function ($attribute, $value, $fail) {
            if ($this->hasFile($attribute)) {
                $file = $this->file($attribute);
                $allowedMimes = ['jpeg', 'png', 'jpg', 'webp', 'gif'];
                if (! in_array(strtolower($file->getClientOriginalExtension()), $allowedMimes)) {
                    $fail("The {$attribute} must be an image (jpeg, png, jpg, webp, gif).");
                }
                if ($file->getSize() > 5120 * 1024) {
                    $fail("The {$attribute} must not be greater than 5MB.");
                }
            } elseif (! is_string($value) && ! is_null($value)) {
                $fail("The {$attribute} must be a valid image file or string path.");
            }
        };

        return [
            'class_level_id' => 'required|exists:class_levels,id',
            'section_id' => 'required|exists:sections,id',
            'shift_id' => 'nullable|exists:shifts,id',
            'student_id' => 'required|string|max:50',
            'roll_number' => 'required|integer|min:1',
            'first_name' => 'required|string|max:100',
            'last_name' => 'nullable|string|max:100',
            'father_name' => 'required|string|max:150',
            'mother_name' => 'required|string|max:150',
            'phone_number' => ['required', 'string', 'regex:/^01[3-9]\d{8}$/'],
            'email' => 'nullable|email|max:150|unique:users,email',
            'gender' => 'required|in:Male,Female,Other',
            'date_of_birth' => 'nullable|date',
            'address' => 'nullable|string',
            'status' => 'required|in:active,inactive,graduated,suspended',
            'enrollment_date' => 'nullable|date',
            'student_image' => ['nullable', $imageRule],
            'parent_image' => ['nullable', $imageRule],
            'father_image' => ['nullable', $imageRule],
            'mother_image' => ['nullable', $imageRule],
            'password' => 'nullable|string|min:6',
        ];
    }

    public function messages(): array
    {
        return [
            'phone_number.regex' => 'The phone number must be a valid 11-digit Bangladeshi mobile number (e.g., 01712345678).',
        ];
    }
}
