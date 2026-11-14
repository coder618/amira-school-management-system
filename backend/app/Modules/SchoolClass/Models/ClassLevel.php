<?php

namespace App\Modules\SchoolClass\Models;

use App\Modules\Academic\Models\Section;
use App\Modules\Academic\Models\Student;
use App\Modules\Core\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClassLevel extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'class_levels';

    protected $fillable = [
        'school_id',
        'academic_year_id',
        'name',
        'numeric_value',
        'code',
    ];

    protected function casts(): array
    {
        return [
            'numeric_value' => 'integer',
        ];
    }

    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }
}

