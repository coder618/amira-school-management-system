<?php

namespace App\Modules\SchoolExamResults\Requests;

use App\Modules\Core\Models\School;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExamResultRequest extends FormRequest
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
            'exam_id' => [
                'required',
                Rule::exists('exams', 'id')->where(function ($query) use ($schoolId) {
                    if ($schoolId) {
                        $query->where('school_id', $schoolId);
                    }
                    return $query;
                }),
            ],
            'subject_id' => [
                'required',
                Rule::exists('subjects', 'id')->where(function ($query) use ($schoolId) {
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
            'subjective_mark' => 'required|numeric|min:0|max:100',
            'objective_mark' => 'required|numeric|min:0|max:100',
            'practical_mark' => 'nullable|numeric|min:0|max:100',
            'is_4th_subject' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'exam_id.exists' => 'The selected exam is invalid or belongs to another institution.',
            'subject_id.exists' => 'The selected subject is invalid or belongs to another institution.',
            'student_id.exists' => 'The selected student is invalid or belongs to another institution.',
        ];
    }
}

