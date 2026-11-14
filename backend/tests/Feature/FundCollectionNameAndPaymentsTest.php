<?php

namespace Tests\Feature;

use App\Modules\Academic\Models\ClassLevel;
use App\Modules\Academic\Models\Section;
use App\Modules\Academic\Models\Student;
use App\Modules\Core\Enums\Role;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use App\Modules\FundCollectionName\Models\FundCollectionName;
use App\Modules\Payments\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FundCollectionNameAndPaymentsTest extends TestCase
{
    use RefreshDatabase;

    protected School $schoolA;
    protected School $schoolB;
    protected User $adminA;
    protected User $adminB;
    protected AcademicYear $yearA;
    protected AcademicYear $yearB;
    protected Student $studentA;

    protected function setUp(): void
    {
        parent::setUp();

        // Tenant School A
        $this->schoolA = School::create([
            'name' => 'St. Joseph Higher Secondary School',
            'code' => 'SJHSS-01',
            'board' => 'Dhaka',
            'is_active' => true,
        ]);

        $this->yearA = AcademicYear::create([
            'school_id' => $this->schoolA->id,
            'title' => '2026-2027',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_current' => true,
        ]);

        $this->adminA = User::create([
            'school_id' => $this->schoolA->id,
            'name' => 'Principal Joseph Admin',
            'email' => 'admin.a@school.com',
            'password' => bcrypt('password'),
            'role' => Role::Admin->value,
            'is_active' => true,
        ]);

        $classA = ClassLevel::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'name' => 'Class 9',
            'numeric_value' => 9,
        ]);

        $sectionA = Section::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'class_level_id' => $classA->id,
            'name' => 'Section A',
            'capacity' => 40,
        ]);

        $this->studentA = Student::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'class_level_id' => $classA->id,
            'section_id' => $sectionA->id,
            'student_id' => 'STU-SJ-001',
            'roll_number' => 1,
            'first_name' => 'Nafis',
            'last_name' => 'Iqbal',
            'father_name' => 'Zafar Iqbal',
            'mother_name' => 'Yasmin Iqbal',
            'gender' => 'Male',
            'phone_number' => '01711002233',
            'status' => 'active',
            'enrollment_date' => '2026-01-01',
        ]);

        // Tenant School B
        $this->schoolB = School::create([
            'name' => 'Rajshahi Collegiate School',
            'code' => 'RCS-02',
            'board' => 'Rajshahi',
            'is_active' => true,
        ]);

        $this->yearB = AcademicYear::create([
            'school_id' => $this->schoolB->id,
            'title' => '2026-2027',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_current' => true,
        ]);

        $this->adminB = User::create([
            'school_id' => $this->schoolB->id,
            'name' => 'Headmaster Rajshahi',
            'email' => 'admin.b@school.com',
            'password' => bcrypt('password'),
            'role' => Role::Admin->value,
            'is_active' => true,
        ]);
    }

    // ==========================================
    // FundCollectionName Module Tests
    // ==========================================

    public function test_tenant_can_create_and_list_fund_collection_names(): void
    {
        $response = $this->actingAs($this->adminA, 'sanctum')
            ->postJson('/api/fund-collection-names', [
                'name' => 'Monthly Tuition Fee',
                'interval' => 'Monthly',
                'default_amount' => 2000.00,
                'description' => 'Standard monthly fee for students',
            ]);

        $response->assertStatus(201);
        $response->assertJsonFragment([
            'name' => 'Monthly Tuition Fee',
            'interval' => 'Monthly',
            'school_id' => $this->schoolA->id,
        ]);

        $list = $this->actingAs($this->adminA, 'sanctum')
            ->getJson('/api/fund-collection-names');

        $list->assertStatus(200);
        $list->assertJsonCount(1);
    }

    public function test_cannot_create_duplicate_fund_collection_name_in_same_tenant_school(): void
    {
        FundCollectionName::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'name' => 'Library Fee',
            'interval' => 'Yearly',
        ]);

        $response = $this->actingAs($this->adminA, 'sanctum')
            ->postJson('/api/fund-collection-names', [
                'name' => 'Library Fee',
                'interval' => 'Yearly',
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_different_schools_can_have_same_fund_collection_name(): void
    {
        FundCollectionName::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'name' => 'Admission Fee',
            'interval' => 'One-Time',
        ]);

        // School B creates the exact same name
        $response = $this->actingAs($this->adminB, 'sanctum')
            ->postJson('/api/fund-collection-names', [
                'name' => 'Admission Fee',
                'interval' => 'One-Time',
            ]);

        $response->assertStatus(201);
        $response->assertJsonFragment([
            'name' => 'Admission Fee',
            'school_id' => $this->schoolB->id,
        ]);
    }

    public function test_tenant_cannot_view_or_modify_other_tenant_fund_collection(): void
    {
        $collectionA = FundCollectionName::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'name' => 'Laboratory Fee',
            'interval' => '6 Months',
        ]);

        // Admin B attempts to access School A's collection -> 403
        $show = $this->actingAs($this->adminB, 'sanctum')
            ->getJson("/api/fund-collection-names/{$collectionA->id}");
        $show->assertStatus(403);

        $update = $this->actingAs($this->adminB, 'sanctum')
            ->putJson("/api/fund-collection-names/{$collectionA->id}", [
                'name' => 'Hacked Fee',
                'interval' => 'Monthly',
            ]);
        $update->assertStatus(403);

        $delete = $this->actingAs($this->adminB, 'sanctum')
            ->deleteJson("/api/fund-collection-names/{$collectionA->id}");
        $delete->assertStatus(403);
    }

    // ==========================================
    // Payments Module Tests
    // ==========================================

    public function test_payment_must_belong_to_a_specific_fund_collection_name(): void
    {
        $collectionA = FundCollectionName::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'name' => 'Semester Fee',
            'interval' => '6 Months',
        ]);

        $response = $this->actingAs($this->adminA, 'sanctum')
            ->postJson('/api/payments', [
                'fund_collection_name_id' => $collectionA->id,
                'student_id' => $this->studentA->id,
                'amount' => 3000.00,
                'paid_amount' => 3000.00,
                'payment_method' => 'bKash',
                'transaction_id' => 'TXN-998877',
            ]);

        $response->assertStatus(201);
        $response->assertJsonFragment([
            'amount' => '3000.00',
            'paid_amount' => '3000.00',
            'due_amount' => '0.00',
            'status' => 'paid',
            'school_id' => $this->schoolA->id,
        ]);
    }

    public function test_payment_calculates_due_and_partial_status_correctly(): void
    {
        $collectionA = FundCollectionName::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'name' => 'Annual Sports & Cultural Fee',
            'interval' => 'Yearly',
        ]);

        // Student pays partial amount: 500 out of 1500
        $response = $this->actingAs($this->adminA, 'sanctum')
            ->postJson('/api/payments', [
                'fund_collection_name_id' => $collectionA->id,
                'student_id' => $this->studentA->id,
                'amount' => 1500.00,
                'paid_amount' => 500.00,
                'payment_method' => 'Cash',
            ]);

        $response->assertStatus(201);
        $response->assertJsonFragment([
            'amount' => '1500.00',
            'paid_amount' => '500.00',
            'due_amount' => '1000.00',
            'status' => 'partially_paid',
        ]);

        $paymentId = $response->json('id');

        // Settle remaining 1000 due
        $settleResponse = $this->actingAs($this->adminA, 'sanctum')
            ->postJson("/api/payments/{$paymentId}/settle", [
                'payment_amount' => 1000.00,
                'payment_method' => 'Nagad',
                'transaction_id' => 'NAGAD-SETTLE-01',
            ]);

        $settleResponse->assertStatus(200);
        $settleResponse->assertJsonPath('payment.status', 'paid');
        $settleResponse->assertJsonPath('payment.due_amount', '0.00');
    }

    public function test_tenant_cannot_create_payment_with_other_tenant_collection_or_student(): void
    {
        $collectionB = FundCollectionName::create([
            'school_id' => $this->schoolB->id,
            'academic_year_id' => $this->yearB->id,
            'name' => 'School B Fee',
            'interval' => 'Monthly',
        ]);

        // Admin A tries to create payment using School B's collection
        $response = $this->actingAs($this->adminA, 'sanctum')
            ->postJson('/api/payments', [
                'fund_collection_name_id' => $collectionB->id,
                'student_id' => $this->studentA->id,
                'amount' => 1000.00,
                'payment_method' => 'Cash',
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['fund_collection_name_id']);
    }

    public function test_cannot_delete_fund_collection_name_with_active_payments(): void
    {
        $collection = FundCollectionName::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'name' => 'Protected Fund',
            'interval' => 'Yearly',
        ]);

        Payment::create([
            'school_id' => $this->schoolA->id,
            'academic_year_id' => $this->yearA->id,
            'fund_collection_name_id' => $collection->id,
            'student_id' => $this->studentA->id,
            'receipt_no' => 'RCP-TEST-001',
            'amount' => 500.00,
            'paid_amount' => 500.00,
            'due_amount' => 0.00,
            'status' => 'paid',
            'payment_method' => 'Cash',
        ]);

        $response = $this->actingAs($this->adminA, 'sanctum')
            ->deleteJson("/api/fund-collection-names/{$collection->id}");

        $response->assertStatus(422);
        $this->assertDatabaseHas('fund_collection_names', ['id' => $collection->id]);
    }
}

