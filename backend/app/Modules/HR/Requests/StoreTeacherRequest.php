<?php

namespace App\Modules\HR\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTeacherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $imageRule = function ($attribute, $value, $fail) {
            $file = $this->file($attribute) ?? ($value instanceof \Illuminate\Http\UploadedFile ? $value : null);

            if ($file instanceof \Illuminate\Http\UploadedFile) {
                if (! $file->isValid()) {
                    if ($file->getError() === UPLOAD_ERR_INI_SIZE || $file->getError() === UPLOAD_ERR_FORM_SIZE) {
                        $fail("The {$attribute} exceeds the maximum upload file size.");
                    } else {
                        $fail("The {$attribute} failed to upload: " . $file->getErrorMessage());
                    }
                    return;
                }

                $allowedMimes = ['jpeg', 'png', 'jpg', 'webp', 'gif'];
                $ext = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: '');
                if (! in_array($ext, $allowedMimes)) {
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
            'name' => 'required|string|max:150',
            'email' => 'required|email|unique:users,email',
            'employee_id' => 'required|string|max:50',
            'designation' => 'required|string|max:100',
            'department' => 'nullable|string|max:100',
            'qualification' => 'nullable|string|max:150',
            'phone_number' => ['nullable', 'string', 'regex:/^01[3-9]\d{8}$/'],
            'card_rfid' => 'nullable|string|max:100',
            'biometric_id' => 'nullable|string|max:100',
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

