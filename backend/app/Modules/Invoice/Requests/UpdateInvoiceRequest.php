<?php

namespace App\Modules\Invoice\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => 'sometimes|required|exists:users,id',
            'title' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0.01|max:9999999.99',
            'fund_collection_name_id' => 'nullable|exists:fund_collection_names,id',
            'student_id' => 'nullable|exists:students,id',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ];
    }
}
