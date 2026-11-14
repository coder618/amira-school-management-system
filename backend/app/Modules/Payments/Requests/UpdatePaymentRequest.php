<?php

namespace App\Modules\Payments\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => 'sometimes|required|numeric|min:0.01',
            'paid_amount' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|in:paid,due,partially_paid,cancelled',
            'payment_method' => 'sometimes|required|string|in:Cash,bKash,Nagad,Bank,Rocket',
            'transaction_id' => 'nullable|string|max:100',
            'payment_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'payment_method.in' => 'Payment method must be one of: Cash, bKash, Nagad, Bank, Rocket.',
            'status.in' => 'Payment status must be one of: paid, due, partially_paid, cancelled.',
        ];
    }
}

