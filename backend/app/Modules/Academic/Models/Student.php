<?php

namespace App\Modules\Academic\Models;

use App\Modules\Core\Models\User;
use App\Modules\Core\Traits\BelongsToTenant;
use App\Modules\Media\Models\Media;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\Storage;

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
        'student_image',
        'parent_image',
        'father_image',
        'mother_image',
        'card_rfid',
        'biometric_id',
        'status',
        'enrollment_date',
    ];

    protected $appends = [
        'full_name',
        'student_image_url',
        'parent_image_url',
        'father_image_url',
        'mother_image_url',
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

    public function media(): MorphMany
    {
        return $this->morphMany(Media::class, 'model');
    }

    public function documents(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(\App\Modules\Documents\Models\Document::class, 'student_id');
    }

    /**
     * Resolve image URL helper.
     */
    protected function resolveImageUrl(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://') || str_starts_with($path, 'data:')) {
            return $path;
        }

        return url('storage/' . ltrim(preg_replace('#^/?storage/#', '', $path), '/'));
    }

    public function getStudentImageUrlAttribute(): ?string
    {
        return $this->resolveImageUrl($this->student_image);
    }

    public function getFatherImageUrlAttribute(): ?string
    {
        return $this->resolveImageUrl($this->father_image);
    }

    public function getMotherImageUrlAttribute(): ?string
    {
        return $this->resolveImageUrl($this->mother_image);
    }

    public function getParentImageUrlAttribute(): ?string
    {
        return $this->resolveImageUrl($this->parent_image ?? $this->father_image ?? $this->mother_image);
    }

    /**
     * Helper to get full name.
     */
    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }
}

