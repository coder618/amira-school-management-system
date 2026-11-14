<?php

namespace Tests\Feature;

use App\Modules\Academic\Models\Student;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use App\Modules\FundCollectionName\Models\FundCollectionName;
use App\Modules\Invoice\Models\Invoice;
use App\Modules\Payments\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceTest extends TestCase
{
    use RefreshDatabase;

    protected School $school;
    protected AcademicYear $academicYear;
    protected User $adminUser;
    protected User $studentUser;
    protected FundCollectionName $collectionHead;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = School::create([
            'name' => 'Dhaka Model School',
            'code' => 'DMS-01',
            'is_active' => true,
        ]);

        $this->academicYear = AcademicYear::create([
            'school_id' => $this->school->id,
            'title' => '2026-2027',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_current' => true,
        ]);

        $this->adminUser = User::create([
            'school_id' => $this->school->id,
            'name' => 'Headmaster Ahmed',
            'email' => 'admin@dms.edu.bd',
            'password' => bcrypt('password'),
            'role' => 'Admin',
            'phone_number' => '01711000001',
            'is_active' => true,
        ]);

        $this->studentUser = User::create([
            'school_id' => $this->school->id,
            'name' => 'Rahim Student',
            'email' => 'rahim@dms.edu.bd',
            'password' => bcrypt('password'),
            'role' => 'Student',
            'phone_number' => '01711000002',
            'is_active' => true,
        ]);

        $this->collectionHead = FundCollectionName::create([
            'school_id' => $this->school->id,
            'name' => 'Monthly Tuition Fee',
            'interval' => 'Monthly',
            'default_amount' => 1500.00,
            'is_active' => true,
        ]);
    }

    public function test_can_create_invoice_attached_to_user_with_due_status(): void
    {
        $payload = [
            'user_id' => $this->studentUser->id,
            'title' => 'Tuition Fee - October 2026',
            'amount' => 1500.00,
            'fund_collection_name_id' => $this->collectionHead->id,
            'due_date' => '2026-10-31',
            'notes' => 'Please pay on or before the due date.',
        ];

        $response = $this->actingAs($this->adminUser)
            ->withHeader('X-School-Id', $this->school->id)
            ->postJson('/api/invoices', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('user_id', $this->studentUser->id)
            ->assertJsonPath('amount', '1500.00')
            ->assertJsonPath('paid_amount', '0.00')
            ->assertJsonPath('due_amount', '1500.00')
            ->assertJsonPath('status', 'due');

        $this->assertDatabaseHas('invoices', [
            'user_id' => $this->studentUser->id,
            'amount' => 1500.00,
            'status' => 'due',
            'title' => 'Tuition Fee - October 2026',
        ]);
    }

    public function test_can_list_invoices_scoped_to_tenant(): void
    {
        Invoice::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->academicYear->id,
            'user_id' => $this->studentUser->id,
            'invoice_no' => 'INV-2026-TEST01',
            'title' => 'Semester Fee',
            'amount' => 2000.00,
            'paid_amount' => 0.00,
            'due_amount' => 2000.00,
            'status' => 'due',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->withHeader('X-School-Id', $this->school->id)
            ->getJson('/api/invoices');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.invoice_no', 'INV-2026-TEST01');
    }

    public function test_partial_payment_creates_payment_record_and_updates_invoice_to_partially_paid(): void
    {
        $invoice = Invoice::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->academicYear->id,
            'user_id' => $this->studentUser->id,
            'fund_collection_name_id' => $this->collectionHead->id,
            'invoice_no' => 'INV-2026-PART01',
            'title' => 'Annual Lab & Library Fee',
            'amount' => 3000.00,
            'paid_amount' => 0.00,
            'due_amount' => 3000.00,
            'status' => 'due',
        ]);

        // User makes partial payment of 1000 via bKash
        $payPayload = [
            'amount' => 1000.00,
            'payment_method' => 'bkash', // test case normalization
            'transaction_id' => 'BK_TRX_998877',
            'notes' => '1st installment payment',
        ];

        $response = $this->actingAs($this->studentUser)
            ->withHeader('X-School-Id', $this->school->id)
            ->postJson("/api/invoices/{$invoice->id}/pay", $payPayload);

        $response->assertStatus(200)
            ->assertJsonPath('invoice.status', 'partially_paid')
            ->assertJsonPath('invoice.paid_amount', '1000.00')
            ->assertJsonPath('invoice.due_amount', '2000.00')
            ->assertJsonPath('payment.payment_method', 'bKash')
            ->assertJsonPath('payment.transaction_id', 'BK_TRX_998877');

        // Check invoice updated in DB
        $this->assertDatabaseHas('invoices', [
            'id' => $invoice->id,
            'status' => 'partially_paid',
            'paid_amount' => 1000.00,
            'due_amount' => 2000.00,
        ]);

        // CRITICAL CHECK: Verify payment record was created in payments module
        $this->assertDatabaseHas('payments', [
            'invoice_id' => $invoice->id,
            'user_id' => $this->studentUser->id,
            'payment_method' => 'bKash',
            'transaction_id' => 'BK_TRX_998877',
            'paid_amount' => 1000.00,
            'status' => 'partially_paid',
        ]);
    }

    public function test_full_settlement_updates_invoice_to_paid_and_creates_payment_record(): void
    {
        $invoice = Invoice::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->academicYear->id,
            'user_id' => $this->studentUser->id,
            'fund_collection_name_id' => $this->collectionHead->id,
            'invoice_no' => 'INV-2026-FULL01',
            'title' => 'Admission Fee',
            'amount' => 5000.00,
            'paid_amount' => 2000.00,
            'due_amount' => 3000.00,
            'status' => 'partially_paid',
        ]);

        // Pay remaining 3000 via Nagad
        $payPayload = [
            'amount' => 3000.00,
            'payment_method' => 'nagad',
            'transaction_id' => 'NG_TRX_112233',
        ];

        $response = $this->actingAs($this->studentUser)
            ->withHeader('X-School-Id', $this->school->id)
            ->postJson("/api/invoices/{$invoice->id}/pay", $payPayload);

        $response->assertStatus(200)
            ->assertJsonPath('invoice.status', 'paid')
            ->assertJsonPath('invoice.paid_amount', '5000.00')
            ->assertJsonPath('invoice.due_amount', '0.00')
            ->assertJsonPath('payment.payment_method', 'Nagad')
            ->assertJsonPath('payment.status', 'paid');

        $this->assertDatabaseHas('invoices', [
            'id' => $invoice->id,
            'status' => 'paid',
            'due_amount' => 0.00,
        ]);

        $this->assertDatabaseHas('payments', [
            'invoice_id' => $invoice->id,
            'user_id' => $this->studentUser->id,
            'payment_method' => 'Nagad',
            'transaction_id' => 'NG_TRX_112233',
            'status' => 'paid',
        ]);
    }

    public function test_paying_invoice_requires_payment_method_and_transaction_id(): void
    {
        $invoice = Invoice::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->academicYear->id,
            'user_id' => $this->studentUser->id,
            'invoice_no' => 'INV-2026-REQ01',
            'title' => 'Sports Fee',
            'amount' => 500.00,
            'paid_amount' => 0.00,
            'due_amount' => 500.00,
            'status' => 'due',
        ]);

        $response = $this->actingAs($this->studentUser)
            ->withHeader('X-School-Id', $this->school->id)
            ->postJson("/api/invoices/{$invoice->id}/pay", [
                'amount' => 500.00,
                // missing payment_method and transaction_id
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['payment_method', 'transaction_id']);
    }

    public function test_cannot_overpay_invoice(): void
    {
        $invoice = Invoice::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->academicYear->id,
            'user_id' => $this->studentUser->id,
            'invoice_no' => 'INV-2026-OVER01',
            'title' => 'Library Fee',
            'amount' => 1000.00,
            'paid_amount' => 0.00,
            'due_amount' => 1000.00,
            'status' => 'due',
        ]);

        $response = $this->actingAs($this->studentUser)
            ->withHeader('X-School-Id', $this->school->id)
            ->postJson("/api/invoices/{$invoice->id}/pay", [
                'amount' => 1500.00, // overpaying by 500
                'payment_method' => 'bKash',
                'transaction_id' => 'OVER_TRX',
            ]);

        $response->assertStatus(422);
    }

    public function test_cannot_pay_already_fully_paid_invoice(): void
    {
        $invoice = Invoice::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->academicYear->id,
            'user_id' => $this->studentUser->id,
            'invoice_no' => 'INV-2026-ALREADY01',
            'title' => 'Exam Fee',
            'amount' => 1000.00,
            'paid_amount' => 1000.00,
            'due_amount' => 0.00,
            'status' => 'paid',
        ]);

        $response = $this->actingAs($this->studentUser)
            ->withHeader('X-School-Id', $this->school->id)
            ->postJson("/api/invoices/{$invoice->id}/pay", [
                'amount' => 200.00,
                'payment_method' => 'Bank',
                'transaction_id' => 'BANK_TRX_1',
            ]);

        $response->assertStatus(422);
    }

    public function test_cannot_delete_invoice_with_payment_records(): void
    {
        $invoice = Invoice::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->academicYear->id,
            'user_id' => $this->studentUser->id,
            'invoice_no' => 'INV-2026-DEL01',
            'title' => 'Tuition',
            'amount' => 2000.00,
            'paid_amount' => 500.00,
            'due_amount' => 1500.00,
            'status' => 'partially_paid',
        ]);

        Payment::create([
            'school_id' => $this->school->id,
            'academic_year_id' => $this->academicYear->id,
            'invoice_id' => $invoice->id,
            'user_id' => $this->studentUser->id,
            'fund_collection_name_id' => $this->collectionHead->id,
            'amount' => 2000.00,
            'paid_amount' => 500.00,
            'due_amount' => 1500.00,
            'status' => 'partially_paid',
            'payment_method' => 'bKash',
            'transaction_id' => 'TRX_DEL_CHECK',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->withHeader('X-School-Id', $this->school->id)
            ->deleteJson("/api/invoices/{$invoice->id}");

        $response->assertStatus(422);
        $this->assertDatabaseHas('invoices', ['id' => $invoice->id]);
    }
}
