<?php

namespace App\Modules\Payments\Requests;

use App\Modules\Core\Models\School;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $schoolId = auth()->user()?->school_id
            ?? ($this->header('X-School-Id') ? (int) $this->header('X-School-Id') : null)
            ?? School::first()?->id;

        return [
            'fund_collection_name_id' => [
                'required',
                Rule::exists('fund_collection_names', 'id')->where(function ($query) use ($schoolId) {
                    if ($schoolId) {
                        $query->where('school_id', $schoolId);
                    }
                    return $query;
                }),
            ],
            'student_id' => [
                'required',
                Rule::exists('students', 'id')->where(function ($query) use ($schoolId) {
                    if ($schoolId) {
                        $query->where('school_id', $schoolId);
                    }
                    return $query;
                }),
            ],
            'amount' => 'required|numeric|min:0.01',
            'paid_amount' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|in:paid,due,partially_paid,cancelled',
            'payment_method' => 'required|string|in:Cash,bKash,Nagad,Bank,Rocket',
            'transaction_id' => 'nullable|string|max:100',
            'payment_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'fund_collection_name_id.required' => 'Payment must be created based on a specific Fund Collection Name.',
            'fund_collection_name_id.exists' => 'The selected Fund Collection Name does not belong to your school.',
            'student_id.exists' => 'The selected student does not belong to your school.',
            'payment_method.in' => 'Payment method must be one of: Cash, bKash, Nagad, Bank, Rocket.',
            'status.in' => 'Payment status must be one of: paid, due, partially_paid, cancelled.',
        ];
    }
}

