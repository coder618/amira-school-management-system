<?php

namespace App\Modules\Exam\Models;

use App\Modules\Academic\Models\Student;
use App\Modules\Core\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamMark extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'exam_marks';

    protected $fillable = [
        'school_id',
        'academic_year_id',
        'student_id',
        'exam_id',
        'subject_id',
        'subjective_mark',
        'objective_mark',
        'practical_mark',
        'total_mark',
        'is_4th_subject',
        'gpa',
        'grade',
    ];

    protected function casts(): array
    {
        return [
            'subjective_mark' => 'decimal:2',
            'objective_mark' => 'decimal:2',
            'practical_mark' => 'decimal:2',
            'total_mark' => 'decimal:2',
            'is_4th_subject' => 'boolean',
            'gpa' => 'decimal:2',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }
}

