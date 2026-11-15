<?php

namespace Tests\Feature;

use App\Modules\Academic\Models\ClassLevel;
use App\Modules\Academic\Models\Section;
use App\Modules\Academic\Models\Student;
use App\Modules\Attendance\Models\Attendance;
use App\Modules\Attendance\Models\AttendanceDevice;
use App\Modules\Attendance\Models\AttendanceDeviceLog;
use App\Modules\Core\Enums\Role;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use App\Modules\HR\Models\Teacher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceDeviceTest extends TestCase
{
    use RefreshDatabase;

    protected School $school;
    protected AcademicYear $year;
    protected User $admin;
    protected ClassLevel $classLevel;
    protected Section $section;
    protected Student $student;
    protected Teacher $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = School::create([
            'name' => 'Future International School',
            'code' => 'FIS-001',
            'board' => 'Dhaka',
            'is_active' => true,
        ]);

        $this->year = AcademicYear::create([
            'school_id' => $this->school->id,
            'title' => '2026-2027',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_current' => true,
        ]);

        $this->admin = User::create([
            'school_id' => $this->school->id,
            'name' => 'Admin User',
            'email' => 'admin@fis.edu',
            'password' => bcrypt('password'),
            'role' => Role::Admin->value,
            'is_active' => true,
        ]);

        $this->classLevel = ClassLevel::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->year->id,
            'name' => 'Grade 10',
            'numeric_value' => 10,
        ]);

        $this->section = Section::create([
            'school_id' => $this->school->id,
            'class_level_id' => $this->classLevel->id,
            'name' => 'A',
            'capacity' => 40,
        ]);

        $this->student = Student::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->year->id,
            'class_level_id' => $this->classLevel->id,
            'section_id' => $this->section->id,
            'student_id' => 'STU-2026-001',
            'roll_number' => 1,
            'first_name' => 'Alice',
            'last_name' => 'Smith',
            'father_name' => 'John Smith',
            'mother_name' => 'Mary Smith',
            'phone_number' => '01711223344',
            'card_rfid' => 'RFID-998877',
            'biometric_id' => 'BIO-001',
            'status' => 'active',
        ]);

        $teacherUser = User::create([
            'school_id' => $this->school->id,
            'name' => 'Dr. Robert Oppenheimer',
            'email' => 'robert@fis.edu',
            'password' => bcrypt('password'),
            'role' => Role::Teacher->value,
            'is_active' => true,
        ]);

        $this->teacher = Teacher::create([
            'school_id' => $this->school->id,
            'user_id' => $teacherUser->id,
            'employee_id' => 'EMP-1001',
            'designation' => 'Physics Professor',
            'card_rfid' => 'TEACH-CARD-8899',
            'biometric_id' => 'BIO-T-100',
        ]);
    }

    public function test_can_register_and_list_attendance_devices(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/attendance/devices', [
                'name' => 'Main Gate RFID Reader',
                'device_id' => 'GATE-READER-01',
                'device_type' => 'rfid',
                'device_model' => 'ZKTeco K40',
                'location' => 'Main Gate Turnstile',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('device.name', 'Main Gate RFID Reader')
            ->assertJsonPath('device.device_id', 'GATE-READER-01');

        $this->assertDatabaseHas('attendance_devices', [
            'school_id' => $this->school->id,
            'device_id' => 'GATE-READER-01',
            'location' => 'Main Gate Turnstile',
        ]);

        $list = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/attendance/devices');

        $list->assertStatus(200)
            ->assertJsonCount(1);
    }

    public function test_can_regenerate_device_api_token(): void
    {
        $device = AttendanceDevice::create([
            'school_id' => $this->school->id,
            'name' => 'Library Scanner',
            'device_id' => 'LIB-SCAN-01',
            'api_token' => AttendanceDevice::generateApiToken(),
            'status' => 'active',
        ]);

        $oldToken = $device->api_token;

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/attendance/devices/{$device->id}/regenerate-token");

        $response->assertStatus(200);
        $this->assertNotEquals($oldToken, $response->json('api_token'));
    }

    public function test_external_device_can_record_student_attendance_via_rfid_card(): void
    {
        $device = AttendanceDevice::create([
            'school_id' => $this->school->id,
            'name' => 'Turnstile Gate A',
            'device_id' => 'TURN-A',
            'api_token' => AttendanceDevice::generateApiToken(),
            'status' => 'active',
        ]);

        // External device punches with X-Device-Token header and student RFID card
        $response = $this->withHeader('X-Device-Token', $device->api_token)
            ->postJson('/api/attendance/device/punch', [
                'identifier' => 'RFID-998877',
                'verification_method' => 'card',
                'punch_type' => 'check_in',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('user_type', 'student')
            ->assertJsonPath('name', 'Alice Smith')
            ->assertJsonPath('attendance_status', 'Present');

        // Check attendances table
        $this->assertDatabaseHas('attendances', [
            'school_id' => $this->school->id,
            'student_id' => $this->student->id,
            'status' => 'Present',
        ]);

        // Check attendance_device_logs table
        $this->assertDatabaseHas('attendance_device_logs', [
            'school_id' => $this->school->id,
            'attendance_device_id' => $device->id,
            'raw_identifier' => 'RFID-998877',
            'status' => 'success',
            'user_type' => 'student',
        ]);

        // Device last_sync_at updated
        $this->assertNotNull($device->fresh()->last_sync_at);
    }

    public function test_external_device_can_record_teacher_attendance(): void
    {
        $device = AttendanceDevice::create([
            'school_id' => $this->school->id,
            'name' => 'Staff Room Biometric',
            'device_id' => 'STAFF-BIO-01',
            'api_token' => AttendanceDevice::generateApiToken(),
            'status' => 'active',
        ]);

        $response = $this->withHeader('X-Device-Token', $device->api_token)
            ->postJson('/api/attendance/device/punch', [
                'identifier' => 'TEACH-CARD-8899',
                'verification_method' => 'fingerprint',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('user_type', 'teacher')
            ->assertJsonPath('name', 'Dr. Robert Oppenheimer');

        $this->assertDatabaseHas('attendance_device_logs', [
            'school_id' => $this->school->id,
            'teacher_id' => $this->teacher->id,
            'status' => 'success',
        ]);
    }

    public function test_unrecognized_card_is_logged_for_admin_review(): void
    {
        $device = AttendanceDevice::create([
            'school_id' => $this->school->id,
            'name' => 'Main Gate',
            'device_id' => 'GATE-01',
            'api_token' => AttendanceDevice::generateApiToken(),
            'status' => 'active',
        ]);

        $response = $this->withHeader('X-Device-Token', $device->api_token)
            ->postJson('/api/attendance/device/punch', [
                'identifier' => 'UNKNOWN-CARD-12345',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'unrecognized')
            ->assertJsonPath('identifier', 'UNKNOWN-CARD-12345');

        $this->assertDatabaseHas('attendance_device_logs', [
            'school_id' => $this->school->id,
            'raw_identifier' => 'UNKNOWN-CARD-12345',
            'status' => 'unrecognized',
        ]);
    }

    public function test_can_assign_unrecognized_card_to_student(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/attendance/device/assign-card', [
                'target_type' => 'student',
                'target_id' => $this->student->id,
                'card_rfid' => 'NEW-CARD-9999',
            ]);

        $response->assertStatus(200);
        $this->assertEquals('NEW-CARD-9999', $this->student->fresh()->card_rfid);
    }

    public function test_bulk_punches_sync(): void
    {
        $device = AttendanceDevice::create([
            'school_id' => $this->school->id,
            'name' => 'Offline Sync Device',
            'device_id' => 'OFFLINE-01',
            'api_token' => AttendanceDevice::generateApiToken(),
            'status' => 'active',
        ]);

        $response = $this->withHeader('X-Device-Token', $device->api_token)
            ->postJson('/api/attendance/device/bulk-punches', [
                'punches' => [
                    ['identifier' => 'RFID-998877'],
                    ['identifier' => 'TEACH-CARD-8899'],
                    ['identifier' => 'RANDOM-GUEST-001'],
                ],
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('total', 3)
            ->assertJsonPath('success_count', 2)
            ->assertJsonPath('unrecognized_count', 1);
    }

    public function test_device_simulator_endpoint(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/attendance/device/simulate', [
                'identifier' => $this->student->student_id, // student_id also works
                'verification_method' => 'barcode_qr',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('student_id', $this->student->id);
    }

    public function test_super_admin_can_manage_devices_across_multiple_tenants(): void
    {
        $superAdmin = User::create([
            'school_id' => $this->school->id,
            'name' => 'Root Super Admin',
            'email' => 'super@root.edu',
            'password' => bcrypt('password'),
            'role' => Role::SuperAdmin->value,
            'is_active' => true,
        ]);

        $secondSchool = School::create([
            'name' => 'Chittagong High School',
            'code' => 'CHS-002',
            'board' => 'Chittagong',
            'is_active' => true,
        ]);

        // Device in school 1
        AttendanceDevice::create([
            'school_id' => $this->school->id,
            'name' => 'FIS Gate Reader',
            'device_id' => 'DEV-FIS-01',
            'api_token' => AttendanceDevice::generateApiToken(),
            'status' => 'active',
        ]);

        // SuperAdmin registers device in school 2 via multi-tenant endpoint
        $storeResponse = $this->actingAs($superAdmin, 'sanctum')
            ->postJson('/api/super-admin/attendance/devices', [
                'school_id' => $secondSchool->id,
                'name' => 'CHS Campus Scanner',
                'device_id' => 'DEV-CHS-01',
                'device_type' => 'facial',
                'location' => 'Main Gate CHS',
            ]);

        $storeResponse->assertStatus(201)
            ->assertJsonPath('device.name', 'CHS Campus Scanner')
            ->assertJsonPath('device.school_id', $secondSchool->id);

        // SuperAdmin views devices across all schools
        $allDevicesResponse = $this->actingAs($superAdmin, 'sanctum')
            ->getJson('/api/super-admin/attendance/devices');

        $allDevicesResponse->assertStatus(200)
            ->assertJsonPath('total', 2);

        // SuperAdmin views multi-tenant telemetry
        $statsResponse = $this->actingAs($superAdmin, 'sanctum')
            ->getJson('/api/super-admin/attendance/devices/stats');

        $statsResponse->assertStatus(200)
            ->assertJsonPath('total_devices', 2)
            ->assertJsonPath('schools_with_devices', 2);

        // Normal tenant admin cannot access multi-tenant module
        $forbiddenResponse = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/super-admin/attendance/devices');

        $forbiddenResponse->assertStatus(403);
    }
}
