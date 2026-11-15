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
            'name' => 'sometimes|required|string|max:150',
            'email' => 'sometimes|required|email|max:150',
            'employee_id' => 'sometimes|required|string|max:50',
            'designation' => 'sometimes|required|string|max:100',
            'department' => 'nullable|string|max:100',
            'qualification' => 'nullable|string|max:150',
            'phone_number' => ['nullable', 'string', 'regex:/^01[3-9]\d{8}$/'],
            'joining_date' => 'nullable|date',
            'password' => 'nullable|string|min:6',
            'profile_picture' => ['nullable', $imageRule],
            'image' => ['nullable', $imageRule],
        ];
    }

    public function messages(): array
    {
        return [
            'phone_number.regex' => 'The phone number must be a valid 11-digit Bangladeshi mobile number (e.g. 01712345678).',
        ];
    }
}

