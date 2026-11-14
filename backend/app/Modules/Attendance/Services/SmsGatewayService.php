<?php

namespace App\Modules\Attendance\Services;

use Illuminate\Support\Facades\Log;

class SmsGatewayService
{
    protected string $provider;
    protected ?string $apiKey;
    protected ?string $senderId;

    public function __construct()
    {
        $this->provider = config('services.sms.provider', 'BulkSMSBD'); // 'BulkSMSBD' or 'SSLWireless'
        $this->apiKey = config('services.sms.api_key', 'DUMMY_API_KEY');
        $this->senderId = config('services.sms.sender_id', 'DIHS_EDU');
    }

    /**
     * Send single SMS to a Bangladeshi mobile number (017..., 018..., etc.)
     */
    public function sendSms(string $phoneNumber, string $message): array
    {
        // Log the SMS dispatch for demonstration & debugging
        Log::info("[SMS Gateway - {$this->provider}] Sending to {$phoneNumber}: \"{$message}\"");

        return [
            'success' => true,
            'provider' => $this->provider,
            'recipient' => $phoneNumber,
            'message' => $message,
            'status' => 'DELIVERED_TO_GATEWAY',
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * Send Absent Notice SMS to parents.
     */
    public function sendAbsentNotice(string $guardianPhone, string $studentName, string $date, string $schoolName): array
    {
        $text = "Notice: Dear Guardian, your ward {$studentName} was marked ABSENT today ({$date}) at {$schoolName}. Please contact the school if unexpected.";

        return $this->sendSms($guardianPhone, $text);
    }
}

