<?php

namespace App\Modules\Exam\Models;

use App\Modules\Core\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Exam extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'exams';

    protected $fillable = [
        'school_id',
        'academic_year_id',
        'name',
        'term',
        'start_date',
        'end_date',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
        ];
    }

    public function marks(): HasMany
    {
        return $this->hasMany(ExamMark::class);
    }
}

