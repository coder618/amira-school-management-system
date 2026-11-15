<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add card/device identifiers to students, teachers, users
        Schema::table('students', function (Blueprint $table) {
            $table->string('card_rfid')->nullable()->index();
            $table->string('biometric_id')->nullable()->index();
        });

        Schema::table('teachers', function (Blueprint $table) {
            $table->string('card_rfid')->nullable()->index();
            $table->string('biometric_id')->nullable()->index();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('card_rfid')->nullable()->index();
        });

        // 2. Attendance Devices Table
        Schema::create('attendance_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('name');
            $table->string('device_id')->index(); // Hardware Serial / Device UID
            $table->string('device_type', 50)->default('rfid'); // rfid, fingerprint, facial, barcode_qr, general
            $table->string('device_model')->nullable(); // e.g. ZKTeco K40, Hikvision, ESP32
            $table->string('api_token', 80)->unique();
            $table->string('ip_address')->nullable();
            $table->string('location')->nullable();
            $table->string('status', 30)->default('active'); // active, inactive, maintenance
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamps();

            $table->unique(['school_id', 'device_id']);
        });

        // 3. Attendance Device Logs Table
        Schema::create('attendance_device_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('attendance_device_id')->nullable()->constrained('attendance_devices')->nullOnDelete();
            $table->string('device_identifier')->nullable();
            $table->string('raw_identifier'); // Scanned Card / Fingerprint ID / Student ID
            $table->string('user_type', 30)->default('unknown'); // student, teacher, user, unknown
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->foreignId('teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->timestamp('punched_at')->index();
            $table->string('punch_type', 30)->default('check_in'); // check_in, check_out, auto
            $table->string('verification_method', 30)->default('card'); // card, fingerprint, face, barcode_qr, manual
            $table->string('status', 30)->default('success'); // success, unrecognized, duplicate, error
            $table->string('response_message')->nullable();
            $table->json('payload_json')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_device_logs');
        Schema::dropIfExists('attendance_devices');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('card_rfid');
        });

        Schema::table('teachers', function (Blueprint $table) {
            $table->dropColumn(['card_rfid', 'biometric_id']);
        });

        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['card_rfid', 'biometric_id']);
        });
    }
};
