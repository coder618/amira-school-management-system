<?php

namespace App\Modules\Attendance\Models;

use App\Modules\Academic\Models\Section;
use App\Modules\Academic\Models\Student;
use App\Modules\Core\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'attendances';

    protected $fillable = [
        'school_id',
        'academic_year_id',
        'student_id',
        'section_id',
        'date',
        'status', // Present, Absent, Late
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }
}

