<?php

namespace App\Modules\Academic\Models;

use App\Modules\Core\Models\User;
use App\Modules\Core\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Student extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'students';

    protected $fillable = [
        'school_id',
        'academic_year_id',
        'class_level_id',
        'section_id',
        'shift_id',
        'user_id',
        'student_id',
        'roll_number',
        'first_name',
        'last_name',
        'father_name',
        'mother_name',
        'phone_number',
        'email',
        'gender',
        'date_of_birth',
        'address',
        'status',
        'enrollment_date',
    ];

    protected function casts(): array
    {
        return [
            'roll_number' => 'integer',
            'date_of_birth' => 'date:Y-m-d',
            'enrollment_date' => 'date:Y-m-d',
        ];
    }

    public function classLevel(): BelongsTo
    {
        return $this->belongsTo(ClassLevel::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Helper to get full name.
     */
    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }
}

