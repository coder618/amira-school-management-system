<?php

namespace App\Modules\Notification\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:150',
            'message' => 'required|string|max:2000',
            'type' => 'nullable|string|in:info,success,warning,urgent,attendance,exam,finance',
            'user_id' => 'nullable|integer|exists:users,id',
            'school_id' => 'nullable|integer|exists:schools,id',
            'data' => 'nullable|array',
        ];
    }
}
