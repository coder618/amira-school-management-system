<?php

namespace App\Modules\FundCollectionName\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFundCollectionNameRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $collection = $this->route('fund_collection_name') ?? $this->route('collection');
        $schoolId = is_object($collection) ? $collection->school_id : auth()->user()?->school_id;
        $collectionId = is_object($collection) ? $collection->id : $collection;

        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('fund_collection_names', 'name')
                    ->where(function ($query) use ($schoolId) {
                        return $query->where('school_id', $schoolId);
                    })
                    ->ignore($collectionId),
            ],
            'interval' => 'required|string|in:Monthly,Quarterly,6 Months,Yearly,One-Time',
            'default_amount' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'A fund collection name ":input" already exists in this school.',
            'interval.in' => 'Interval must be one of: Monthly, Quarterly, 6 Months, Yearly, One-Time.',
        ];
    }
}

