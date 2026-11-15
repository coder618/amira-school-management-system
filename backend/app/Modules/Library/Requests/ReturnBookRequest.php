<?php

namespace App\Modules\Library\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReturnBookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'return_date' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'in:returned,lost'],
            'fine_amount' => ['nullable', 'numeric', 'min:0'],
            'fine_status' => ['nullable', 'string', 'in:unpaid,paid,waived'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
