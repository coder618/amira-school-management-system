<?php

namespace App\Modules\Attendance\Models;

use App\Modules\Academic\Models\Student;
use App\Modules\Core\Models\User;
use App\Modules\Core\Traits\BelongsToTenant;
use App\Modules\HR\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceDeviceLog extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'attendance_device_logs';

    protected $fillable = [
        'school_id',
        'attendance_device_id',
        'device_identifier',
        'raw_identifier',
        'user_type',
        'user_id',
        'student_id',
        'teacher_id',
        'punched_at',
        'punch_type',
        'verification_method',
        'status',
        'response_message',
        'payload_json',
    ];

    protected function casts(): array
    {
        return [
            'punched_at' => 'datetime',
            'payload_json' => 'array',
        ];
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(AttendanceDevice::class, 'attendance_device_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
