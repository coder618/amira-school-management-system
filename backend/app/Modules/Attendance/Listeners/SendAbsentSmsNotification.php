<?php

namespace App\Modules\Attendance\Listeners;

use App\Modules\Attendance\Events\AttendanceMarked;
use App\Modules\Attendance\Services\SmsGatewayService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendAbsentSmsNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        protected SmsGatewayService $smsService
    ) {}

    public function handle(AttendanceMarked $event): void
    {
        if (! $event->sendSms) {
            return;
        }

        foreach ($event->attendances as $record) {
            if ($record->status === 'Absent' && $record->student) {
                $student = $record->student;
                $phone = $student->phone_number;
                $studentName = $student->first_name . ' ' . $student->last_name;
                $schoolName = $student->school?->name ?? 'Dhaka Ideal High School';

                if (! empty($phone)) {
                    $res = $this->smsService->sendAbsentNotice($phone, $studentName, $event->date, $schoolName);
                    Log::info("[Absent SMS Dispatched] Student: {$studentName}, Mobile: {$phone}, Status: {$res['status']}");
                }
            }
        }
    }
}

