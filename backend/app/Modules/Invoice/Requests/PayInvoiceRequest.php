<?php

namespace App\Modules\Invoice\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PayInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string|max:50',
            'transaction_id' => 'required|string|max:100',
            'notes' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'amount.required' => 'Payment amount is required.',
            'amount.min' => 'Payment amount must be at least 0.01 BDT.',
            'payment_method.required' => 'Payment system name (e.g. bKash, Nagad, Bank, etc.) is required.',
            'transaction_id.required' => 'A valid transaction ID is required for verification.',
        ];
    }

    /**
     * Normalize payment method name for consistency across the system.
     */
    public function normalizedPaymentMethod(): string
    {
        $raw = trim($this->input('payment_method'));
        $lower = strtolower($raw);

        if ($lower === 'bkash' || $lower === 'bikash') {
            return 'bKash';
        }
        if ($lower === 'nagad') {
            return 'Nagad';
        }
        if ($lower === 'rocket') {
            return 'Rocket';
        }
        if ($lower === 'upay') {
            return 'Upay';
        }
        if ($lower === 'bank' || str_contains($lower, 'bank')) {
            return 'Bank';
        }
        if ($lower === 'cash') {
            return 'Cash';
        }

        return ucfirst($raw);
    }
}
