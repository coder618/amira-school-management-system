<?php

namespace App\Modules\Attendance\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AttendanceMarked
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param array $attendances Array of Attendance models or records
     * @param string $date Date of attendance
     * @param bool $sendSms Whether to dispatch absentee SMS
     */
    public function __construct(
        public array $attendances,
        public string $date,
        public bool $sendSms = true
    ) {}
}

