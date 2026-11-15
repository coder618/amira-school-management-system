<?php

namespace App\Modules\Attendance\Models;

use App\Modules\Core\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class AttendanceDevice extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'attendance_devices';

    protected $fillable = [
        'school_id',
        'name',
        'device_id',
        'device_type',
        'device_model',
        'api_token',
        'ip_address',
        'location',
        'status',
        'last_sync_at',
    ];

    protected function casts(): array
    {
        return [
            'last_sync_at' => 'datetime',
        ];
    }

    public static function generateApiToken(): string
    {
        return 'adt_' . Str::random(48);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(AttendanceDeviceLog::class, 'attendance_device_id');
    }
}
