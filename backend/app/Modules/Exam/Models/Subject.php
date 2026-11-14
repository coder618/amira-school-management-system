<?php

namespace App\Modules\Exam\Models;

use App\Modules\Academic\Models\ClassLevel;
use App\Modules\Core\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'subjects';

    protected $fillable = [
        'school_id',
        'academic_year_id',
        'class_level_id',
        'name',
        'code',
        'full_mark',
        'pass_mark',
        'is_optional',
        'can_be_4th_subject',
    ];

    protected function casts(): array
    {
        return [
            'full_mark' => 'decimal:2',
            'pass_mark' => 'decimal:2',
            'is_optional' => 'boolean',
            'can_be_4th_subject' => 'boolean',
        ];
    }

    public function classLevel(): BelongsTo
    {
        return $this->belongsTo(ClassLevel::class);
    }

    public function marks(): HasMany
    {
        return $this->hasMany(ExamMark::class);
    }
}

