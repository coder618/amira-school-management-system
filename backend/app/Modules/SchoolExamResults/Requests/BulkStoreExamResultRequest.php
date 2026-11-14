<?php

namespace App\Modules\SchoolExamResults\Requests;

use App\Modules\Core\Models\School;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkStoreExamResultRequest extends FormRequest
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
            'marks' => 'required|array|min:1',
            'marks.*.student_id' => [
                'required',
                Rule::exists('students', 'id')->where(function ($query) use ($schoolId) {
                    if ($schoolId) {
                        $query->where('school_id', $schoolId);
                    }
                    return $query;
                }),
            ],
            'marks.*.subjective_mark' => 'required|numeric|min:0|max:100',
            'marks.*.objective_mark' => 'required|numeric|min:0|max:100',
            'marks.*.practical_mark' => 'nullable|numeric|min:0|max:100',
            'marks.*.is_4th_subject' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'exam_id.exists' => 'The selected exam does not belong to your school.',
            'subject_id.exists' => 'The selected subject does not belong to your school.',
            'marks.*.student_id.exists' => 'One or more students do not belong to your school.',
        ];
    }
}

