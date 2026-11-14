<?php

namespace App\Modules\SchoolExams\Requests;

use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExamRequest extends FormRequest
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

        $academicYearId = (int) $this->header('X-Academic-Year-Id');
        if (! $academicYearId && $schoolId) {
            $currentYear = AcademicYear::where('school_id', $schoolId)->where('is_current', true)->first()
                ?? AcademicYear::where('school_id', $schoolId)->first();
            $academicYearId = $currentYear?->id ?? AcademicYear::first()?->id;
        }

        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('exams', 'name')->where(function ($query) use ($schoolId, $academicYearId) {
                    $q = $query->where('school_id', $schoolId);
                    if ($academicYearId) {
                        $q->where('academic_year_id', $academicYearId);
                    }
                    return $q;
                }),
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

