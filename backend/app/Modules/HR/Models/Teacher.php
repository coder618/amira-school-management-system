<?php

namespace App\Modules\HR\Models;

use App\Modules\Academic\Models\Section;
use App\Modules\Core\Models\User;
use App\Modules\Core\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Teacher extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'teachers';

    protected $fillable = [
        'school_id',
        'user_id',
        'employee_id',
        'designation',
        'department',
        'qualification',
        'phone_number',
        'joining_date',
    ];

    protected function casts(): array
    {
        return [
            'joining_date' => 'date:Y-m-d',
        ];
    }

    protected $appends = [
        'profile_picture_url',
    ];

    public function getProfilePictureUrlAttribute(): ?string
    {
        return $this->user?->profile_picture_url;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignedSections(): HasMany
    {
        return $this->hasMany(Section::class, 'class_teacher_id');
    }
}

