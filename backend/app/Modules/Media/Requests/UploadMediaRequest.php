<?php

namespace App\Modules\Media\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => 'required|file|max:10240|mimes:jpeg,png,jpg,webp,gif,svg,pdf,doc,docx',
            'collection_name' => 'nullable|string|max:60',
            'model_type' => 'nullable|string|max:150',
            'model_id' => 'nullable|integer',
        ];
    }
}
