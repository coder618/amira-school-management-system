<?php

namespace App\Modules\Library\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'author' => ['sometimes', 'required', 'string', 'max:255'],
            'isbn' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'publisher' => ['nullable', 'string', 'max:255'],
            'edition' => ['nullable', 'string', 'max:100'],
            'publication_year' => ['nullable', 'string', 'max:20'],
            'total_copies' => ['sometimes', 'required', 'integer', 'min:1', 'max:10000'],
            'available_copies' => ['nullable', 'integer', 'min:0'],
            'rack_number' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'cover_image' => ['nullable', 'string', 'max:500'],
            'status' => ['nullable', 'string', 'in:available,maintenance,archived,lost'],
        ];
    }
}
