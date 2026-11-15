<?php

namespace App\Modules\Documents\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'document_type' => 'nullable|string|max:100',
            'user_id' => 'nullable|integer|exists:users,id',
            'student_id' => 'nullable|integer|exists:students,id',
            'description' => 'nullable|string|max:2000',
            'status' => 'nullable|string|in:active,archived,verified',
            'file' => 'required_without:media_id|nullable|file|max:25600|mimes:jpeg,png,jpg,webp,gif,svg,pdf,doc,docx,xls,xlsx,csv,txt',
            'media_id' => 'required_without:file|nullable|integer|exists:media,id',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Document title is required.',
            'file.required_without' => 'Please select a document file to upload or provide an existing media asset ID.',
            'file.max' => 'The file size must not exceed 25MB.',
        ];
    }
}
