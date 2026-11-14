<?php

namespace App\Modules\Invoice\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01|max:9999999.99',
            'fund_collection_name_id' => 'nullable|exists:fund_collection_names,id',
            'student_id' => 'nullable|exists:students,id',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required' => 'Each invoice must be attached to a specific user.',
            'user_id.exists' => 'The selected user does not exist.',
            'amount.min' => 'Invoice amount must be at least 0.01 BDT.',
            'title.required' => 'Invoice title or fee purpose is required.',
        ];
    }
}
