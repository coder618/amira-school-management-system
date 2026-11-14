<?php

namespace App\Modules\SchoolExams\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $exam = $this->route('exam') ?? $this->route('school_exam');
        $schoolId = is_object($exam) ? $exam->school_id : auth()->user()?->school_id;
        $academicYearId = is_object($exam) ? $exam->academic_year_id : null;
        $examId = is_object($exam) ? $exam->id : $exam;

        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('exams', 'name')
                    ->where(function ($query) use ($schoolId, $academicYearId) {
                        $q = $query->where('school_id', $schoolId);
                        if ($academicYearId) {
                            $q->where('academic_year_id', $academicYearId);
                        }
                        return $q;
                    })
                    ->ignore($examId),
            ],
            'term' => 'required|string|max:50',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_published' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'An exam named ":input" already exists for this academic term.',
            'end_date.after_or_equal' => 'The exam end date must be on or after the start date.',
        ];
    }
}

