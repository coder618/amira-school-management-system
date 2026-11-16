<?php

namespace App\Modules\Academic\Models;

use App\Modules\Core\Models\User;
use App\Modules\Core\Traits\BelongsToTenant;
use App\Modules\HR\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeacherNote extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'student_teacher_notes';

    protected $fillable = [
        'school_id',
        'student_id',
        'teacher_id',
        'author_id',
        'author_name',
        'title',
        'category',
        'note',
        'date',
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

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
