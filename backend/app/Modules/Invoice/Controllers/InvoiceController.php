<?php

namespace App\Modules\Invoice\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Academic\Models\Student;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\FundCollectionName\Models\FundCollectionName;
use App\Modules\Invoice\Models\Invoice;
use App\Modules\Invoice\Requests\PayInvoiceRequest;
use App\Modules\Invoice\Requests\StoreInvoiceRequest;
use App\Modules\Invoice\Requests\UpdateInvoiceRequest;
use App\Modules\Payments\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    /**
     * Display a listing of invoices scoped to the current school tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Invoice::with(['user', 'fundCollectionName', 'student.classLevel', 'student.section', 'payments'])
            ->forTenant();

        // If regular student/parent user, only return their attached invoices
        if (auth()->check() && in_array(auth()->user()->role, ['Student', 'Parent'])) {
            $query->where('user_id', auth()->id());
        } elseif ($request->filled('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('fund_collection_name_id')) {
            $query->where('fund_collection_name_id', $request->query('fund_collection_name_id'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('invoice_no', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhere('transaction_id', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $invoices = $query->orderBy('id', 'desc')->get();

        return response()->json($invoices);
    }

    /**
     * Store a newly created invoice attached to a user.
     */
    public function store(StoreInvoiceRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $schoolId = auth()->user()?->school_id
            ?? ($request->header('X-School-Id') ? (int) $request->header('X-School-Id') : null)
            ?? School::first()?->id;

        $academicYearId = (int) $request->header('X-Academic-Year-Id');
        if (! $academicYearId) {
            $currentYear = AcademicYear::where('school_id', $schoolId)->where('is_current', true)->first()
                ?? AcademicYear::where('school_id', $schoolId)->first();
            $academicYearId = $currentYear?->id ?? AcademicYear::first()?->id;
        }

        $totalAmount = round((float) $validated['amount'], 2);

        // Auto-detect linked student if student_id not explicitly supplied
        $studentId = $validated['student_id'] ?? null;
        if (! $studentId) {
            $studentId = Student::where('user_id', $validated['user_id'])->value('id');
        }

        // Generate unique invoice number
        $invoiceNo = 'INV-' . date('Y') . '-' . strtoupper(Str::random(6));

        $invoice = Invoice::create([
            'school_id' => $schoolId,
            'academic_year_id' => $academicYearId,
            'user_id' => $validated['user_id'],
            'student_id' => $studentId,
            'fund_collection_name_id' => $validated['fund_collection_name_id'] ?? null,
            'invoice_no' => $invoiceNo,
            'title' => $validated['title'],
            'amount' => $totalAmount,
            'paid_amount' => 0.00,
            'due_amount' => $totalAmount,
            'status' => 'due',
            'due_date' => $validated['due_date'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        $invoice->load(['user', 'fundCollectionName', 'student', 'payments']);

        return response()->json($invoice, 201);
    }

    /**
     * Display the specified invoice.
     */
    public function show(Invoice $invoice): JsonResponse
    {
        $this->authorizeTenant($invoice);

        if (auth()->check() && in_array(auth()->user()->role, ['Student', 'Parent']) && $invoice->user_id !== auth()->id()) {
            abort(403, 'Unauthorized access to this invoice.');
        }

        $invoice->load(['user', 'fundCollectionName', 'student.classLevel', 'student.section', 'payments', 'school', 'academicYear']);

        return response()->json($invoice);
    }

    /**
     * Update the specified invoice details.
     */
    public function update(UpdateInvoiceRequest $request, Invoice $invoice): JsonResponse
    {
        $this->authorizeTenant($invoice);

        $validated = $request->validated();

        if (array_key_exists('amount', $validated)) {
            $newAmount = round((float) $validated['amount'], 2);
            if ($newAmount < (float) $invoice->paid_amount) {
                return response()->json([
                    'message' => "Invoice amount ({$newAmount}) cannot be less than already collected amount ({$invoice->paid_amount}).",
                ], 422);
            }
            $dueAmount = max(0, round($newAmount - (float) $invoice->paid_amount, 2));
            $validated['amount'] = $newAmount;
            $validated['due_amount'] = $dueAmount;
            $validated['status'] = ($dueAmount == 0) ? 'paid' : ((float) $invoice->paid_amount > 0 ? 'partially_paid' : 'due');
        }

        $invoice->update($validated);
        $invoice->load(['user', 'fundCollectionName', 'student', 'payments']);

        return response()->json($invoice);
    }

    /**
     * Pay an invoice (full or partial).
     * Takes payment system name (bKash, Nagad, Bank, etc.) and transaction ID.
     * When paid or partially paid, it generates a payment record in the Payments module.
     */
    public function pay(PayInvoiceRequest $request, Invoice $invoice): JsonResponse
    {
        $this->authorizeTenant($invoice);

        if ($invoice->status === 'paid' || (float) $invoice->due_amount <= 0) {
            return response()->json([
                'message' => "Invoice #{$invoice->invoice_no} has already been fully paid.",
            ], 422);
        }

        $payAmount = round((float) $request->input('amount'), 2);
        $currentDue = (float) $invoice->due_amount;

        if ($payAmount > $currentDue) {
            return response()->json([
                'message' => "Payment amount ({$payAmount} BDT) exceeds remaining due ({$currentDue} BDT).",
            ], 422);
        }

        $paymentMethod = $request->normalizedPaymentMethod();
        $transactionId = trim((string) $request->input('transaction_id'));

        // Calculate new paid total & remaining due
        $newPaidTotal = round((float) $invoice->paid_amount + $payAmount, 2);
        $newDueAmount = max(0, round((float) $invoice->amount - $newPaidTotal, 2));
        $newStatus = ($newDueAmount == 0) ? 'paid' : 'partially_paid';

        // Update the invoice record
        $invoice->update([
            'paid_amount' => $newPaidTotal,
            'due_amount' => $newDueAmount,
            'status' => $newStatus,
            'payment_method' => $paymentMethod,
            'transaction_id' => $transactionId,
        ]);

        // Resolve student ID if linked
        $studentId = $invoice->student_id
            ?? Student::where('user_id', $invoice->user_id)->value('id');

        // Resolve collection head fallback if not attached
        $fundCollectionNameId = $invoice->fund_collection_name_id
            ?? FundCollectionName::where('school_id', $invoice->school_id)->first()?->id;

        // Create Payment record in payments module
        $receiptNo = 'RCP-' . date('Y') . '-' . strtoupper(Str::random(6));

        $paymentRecord = Payment::create([
            'school_id' => $invoice->school_id,
            'academic_year_id' => $invoice->academic_year_id,
            'fund_collection_name_id' => $fundCollectionNameId,
            'student_id' => $studentId,
            'invoice_id' => $invoice->id,
            'user_id' => $invoice->user_id,
            'receipt_no' => $receiptNo,
            'amount' => (float) $invoice->amount,
            'paid_amount' => $payAmount,
            'due_amount' => $newDueAmount,
            'status' => $newStatus,
            'payment_method' => $paymentMethod,
            'transaction_id' => $transactionId,
            'payment_date' => now()->toDateString(),
            'received_by' => auth()->user()?->name ?? 'Online Portal',
            'notes' => "Payment for Invoice #{$invoice->invoice_no} via {$paymentMethod} (TrxID: {$transactionId}). " . ($request->input('notes') ?? ''),
        ]);

        $invoice->load(['user', 'fundCollectionName', 'student', 'payments']);

        return response()->json([
            'message' => $newStatus === 'paid'
                ? "Invoice #{$invoice->invoice_no} has been settled in full."
                : "Invoice #{$invoice->invoice_no} partially paid ({$payAmount} BDT). Remaining due: {$newDueAmount} BDT.",
            'invoice' => $invoice,
            'payment' => $paymentRecord,
        ]);
    }

    /**
     * Delete an invoice if no payments have been processed against it.
     */
    public function destroy(Invoice $invoice): JsonResponse
    {
        $this->authorizeTenant($invoice);

        if ($invoice->payments()->count() > 0 || (float) $invoice->paid_amount > 0) {
            return response()->json([
                'message' => 'Cannot delete an invoice that has associated payment transaction records.',
            ], 422);
        }

        $invoice->delete();

        return response()->json([
            'message' => "Invoice #{$invoice->invoice_no} deleted successfully.",
        ]);
    }

    /**
     * Aggregate invoice statistics for the tenant school.
     */
    public function stats(): JsonResponse
    {
        $query = Invoice::forTenant();

        if (auth()->check() && in_array(auth()->user()->role, ['Student', 'Parent'])) {
            $query->where('user_id', auth()->id());
        }

        $invoices = $query->get();

        $totalBilled = $invoices->sum('amount');
        $totalCollected = $invoices->sum('paid_amount');
        $totalDue = $invoices->sum('due_amount');

        return response()->json([
            'total_billed' => round($totalBilled, 2),
            'total_collected' => round($totalCollected, 2),
            'total_due' => round($totalDue, 2),
            'total_invoices' => $invoices->count(),
            'paid_count' => $invoices->where('status', 'paid')->count(),
            'due_count' => $invoices->where('status', 'due')->count(),
            'partially_paid_count' => $invoices->where('status', 'partially_paid')->count(),
        ]);
    }

    /**
     * Verify tenant ownership.
     */
    protected function authorizeTenant(Invoice $invoice): void
    {
        if (auth()->check() && auth()->user()->school_id && $invoice->school_id !== auth()->user()->school_id) {
            abort(403, 'Unauthorized access to this school tenant.');
        }
    }
}
