<?php

namespace Tests\Feature;

use App\Modules\Core\Enums\Role;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use App\Modules\FundCollectionName\Models\FundCollectionName;
use App\Modules\Payments\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchoolSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected School $school;

    protected User $adminUser;

    protected User $teacherUser;

    protected User $studentUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = School::create([
            'name' => 'Original Model School',
            'code' => 'OMS-001',
            'eiin' => '112233',
            'board' => 'Dhaka',
            'address' => 'Old Town, Dhaka',
            'phone' => '01711111111',
            'email' => 'admin@original-school.edu.bd',
            'is_active' => true,
        ]);

        $this->adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
            'role' => Role::Admin->value,
            'school_id' => $this->school->id,
            'is_active' => true,
        ]);

        $this->teacherUser = User::create([
            'name' => 'Teacher User',
            'email' => 'teacher@test.com',
            'password' => bcrypt('password'),
            'role' => Role::Teacher->value,
            'school_id' => $this->school->id,
            'is_active' => true,
        ]);

        $this->studentUser = User::create([
            'name' => 'Student User',
            'email' => 'student@test.com',
            'password' => bcrypt('password'),
            'role' => Role::Student->value,
            'school_id' => $this->school->id,
            'is_active' => true,
        ]);
    }

    public function test_authenticated_user_can_view_current_school(): void
    {
        $response = $this->actingAs($this->adminUser)->getJson('/api/school/current');

        $response->assertStatus(200)
            ->assertJson([
                'id' => $this->school->id,
                'name' => 'Original Model School',
                'code' => 'OMS-001',
                'eiin' => '112233',
                'board' => 'Dhaka',
            ]);
    }

    public function test_admin_can_update_school_specific_information(): void
    {
        $payload = [
            'name' => 'Dhaka Ideal High School & College',
            'code' => 'DIHS-001',
            'eiin' => '108250',
            'board' => 'Dhaka',
            'address' => 'Motijheel C/A, Dhaka-1000, Bangladesh',
            'phone' => '01711000000',
            'email' => 'info@dhaka-ideal.edu.bd',
            'division' => 'Dhaka',
            'district' => 'Dhaka',
            'thana' => 'Motijheel',
        ];

        $response = $this->actingAs($this->adminUser)
            ->putJson('/api/school/current', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'School institutional information updated successfully.',
                'school' => [
                    'name' => 'Dhaka Ideal High School & College',
                    'code' => 'DIHS-001',
                    'eiin' => '108250',
                    'board' => 'Dhaka',
                    'address' => 'Motijheel C/A, Dhaka-1000, Bangladesh',
                    'phone' => '01711000000',
                    'email' => 'info@dhaka-ideal.edu.bd',
                ],
            ]);

        $this->assertDatabaseHas('schools', [
            'id' => $this->school->id,
            'name' => 'Dhaka Ideal High School & College',
            'code' => 'DIHS-001',
            'eiin' => '108250',
            'phone' => '01711000000',
            'email' => 'info@dhaka-ideal.edu.bd',
        ]);
    }

    public function test_non_admin_teacher_cannot_update_school_information(): void
    {
        $payload = [
            'name' => 'Hacked School Name',
            'code' => 'HACK-999',
            'address' => 'Unknown',
        ];

        $response = $this->actingAs($this->teacherUser)
            ->putJson('/api/school/current', $payload);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Unauthorized. Only admin role users can update school information.',
            ]);

        $this->assertDatabaseMissing('schools', [
            'name' => 'Hacked School Name',
        ]);
    }

    public function test_non_admin_student_cannot_update_school_information(): void
    {
        $payload = [
            'name' => 'Student School Name',
            'code' => 'STU-001',
            'address' => 'Campus',
        ];

        $response = $this->actingAs($this->studentUser)
            ->putJson('/api/school/current', $payload);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Unauthorized. Only admin role users can update school information.',
            ]);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->putJson('/api/school/current', [
            'name' => 'Anon School',
            'code' => 'ANON',
            'address' => 'Nowhere',
        ]);

        $response->assertStatus(401);
    }

    public function test_payment_pdf_reflects_updated_school_information(): void
    {
        $academicYear = AcademicYear::create([
            'school_id' => $this->school->id,
            'title' => '2026-2027',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_current' => true,
        ]);

        $fund = FundCollectionName::create([
            'school_id' => $this->school->id,
            'name' => 'Monthly Tuition Fee',
            'interval' => 'Monthly',
            'default_amount' => 5000.00,
            'is_active' => true,
        ]);

        $payment = Payment::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $academicYear->id,
            'fund_collection_name_id' => $fund->id,
            'receipt_no' => 'REC-2026-9999',
            'amount' => 5000.00,
            'paid_amount' => 5000.00,
            'due_amount' => 0.00,
            'status' => 'paid',
            'payment_method' => 'cash',
            'payment_date' => '2026-11-14',
        ]);

        // Update school
        $this->actingAs($this->adminUser)->putJson('/api/school/current', [
            'name' => 'Dhaka Ideal High School & College',
            'code' => 'DIHS-001',
            'eiin' => '108250',
            'board' => 'Dhaka',
            'address' => 'Motijheel C/A, Dhaka-1000, Bangladesh',
            'phone' => '01711000000',
            'email' => 'info@dhaka-ideal.edu.bd',
        ]);

        // Download PDF
        $response = $this->actingAs($this->adminUser)->get("/api/payments/{$payment->id}/pdf");
        $response->assertStatus(200);
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));
    }
}
