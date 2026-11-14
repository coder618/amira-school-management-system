<?php

namespace App\Modules\Payments\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\Payments\Models\Payment;
use App\Modules\Payments\Requests\StorePaymentRequest;
use App\Modules\Payments\Requests\UpdatePaymentRequest;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;
use NumberFormatter;

class PaymentController extends Controller
{
    /**
     * List all payments scoped to the tenant school.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Payment::with(['fundCollectionName', 'student.classLevel', 'student.section'])
            ->forTenant();

        if ($request->filled('fund_collection_name_id')) {
            $query->where('fund_collection_name_id', $request->query('fund_collection_name_id'));
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->query('student_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->query('payment_method'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('receipt_no', 'like', "%{$search}%")
                    ->orWhere('transaction_id', 'like', "%{$search}%")
                    ->orWhereHas('student', function ($sq) use ($search) {
                        $sq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('student_id', 'like', "%{$search}%")
                            ->orWhere('phone_number', 'like', "%{$search}%");
                    });
            });
        }

        $payments = $query->orderBy('id', 'desc')->get();

        return response()->json($payments);
    }

    /**
     * Store a new payment based on a specific FundCollectionName.
     */
    public function store(StorePaymentRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $schoolId = auth()->user()?->school_id
            ?? ($request->header('X-School-Id') ? (int) $request->header('X-School-Id') : null)
            ?? School::first()?->id;

        $validated['school_id'] = $schoolId;

        if (empty($validated['academic_year_id'])) {
            $academicYearId = (int) $request->header('X-Academic-Year-Id');
            if (! $academicYearId) {
                $currentYear = AcademicYear::where('school_id', $schoolId)->where('is_current', true)->first()
                    ?? AcademicYear::where('school_id', $schoolId)->first();
                $academicYearId = $currentYear?->id ?? AcademicYear::first()?->id;
            }
            $validated['academic_year_id'] = $academicYearId;
        }

        $totalAmount = (float) $validated['amount'];
        $paidAmount = isset($validated['paid_amount']) ? (float) $validated['paid_amount'] : 0.00;
        $dueAmount = max(0, $totalAmount - $paidAmount);

        // Auto-calculate status if not explicitly passed
        if (empty($validated['status'])) {
            if ($paidAmount >= $totalAmount) {
                $status = 'paid';
            } elseif ($paidAmount > 0) {
                $status = 'partially_paid';
            } else {
                $status = 'due';
            }
        } else {
            $status = $validated['status'];
        }

        // Generate receipt number
        $receiptNo = 'RCP-' . date('Y') . '-' . strtoupper(Str::random(6));

        $payment = Payment::create([
            'school_id' => $schoolId,
            'academic_year_id' => $validated['academic_year_id'],
            'fund_collection_name_id' => $validated['fund_collection_name_id'],
            'student_id' => $validated['student_id'],
            'receipt_no' => $receiptNo,
            'amount' => $totalAmount,
            'paid_amount' => $paidAmount,
            'due_amount' => $dueAmount,
            'status' => $status,
            'payment_method' => $validated['payment_method'],
            'transaction_id' => $validated['transaction_id'] ?? null,
            'payment_date' => $validated['payment_date'] ?? ($paidAmount > 0 ? now()->toDateString() : null),
            'due_date' => $validated['due_date'] ?? null,
            'received_by' => auth()->user()?->name ?? 'Admin Staff',
            'notes' => $validated['notes'] ?? null,
        ]);

        $payment->load(['fundCollectionName', 'student.classLevel', 'student.section']);

        return response()->json($payment, 201);
    }

    /**
     * Show a specific payment record.
     */
    public function show(Payment $payment): JsonResponse
    {
        $this->authorizeTenant($payment);

        $payment->load(['fundCollectionName', 'student.classLevel', 'student.section', 'school', 'academicYear']);

        return response()->json($payment);
    }

    /**
     * Update an existing payment.
     */
    public function update(UpdatePaymentRequest $request, Payment $payment): JsonResponse
    {
        $this->authorizeTenant($payment);

        $validated = $request->validated();

        $totalAmount = array_key_exists('amount', $validated) ? (float) $validated['amount'] : (float) $payment->amount;
        $paidAmount = array_key_exists('paid_amount', $validated) ? (float) $validated['paid_amount'] : (float) $payment->paid_amount;
        $dueAmount = max(0, $totalAmount - $paidAmount);

        if (array_key_exists('status', $validated) && ! empty($validated['status'])) {
            $status = $validated['status'];
        } else {
            if ($paidAmount >= $totalAmount) {
                $status = 'paid';
            } elseif ($paidAmount > 0) {
                $status = 'partially_paid';
            } else {
                $status = 'due';
            }
        }

        $payment->update(array_merge($validated, [
            'amount' => $totalAmount,
            'paid_amount' => $paidAmount,
            'due_amount' => $dueAmount,
            'status' => $status,
        ]));

        $payment->load(['fundCollectionName', 'student.classLevel', 'student.section']);

        return response()->json($payment);
    }

    /**
     * Settle or record an additional collection towards a due payment.
     */
    public function settle(Request $request, Payment $payment): JsonResponse
    {
        $this->authorizeTenant($payment);

        $validated = $request->validate([
            'payment_amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string|in:Cash,bKash,Nagad,Bank,Rocket',
            'transaction_id' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        $newPaymentAmount = (float) $validated['payment_amount'];
        $newPaidTotal = (float) $payment->paid_amount + $newPaymentAmount;
        $dueAmount = max(0, (float) $payment->amount - $newPaidTotal);

        $status = $dueAmount == 0 ? 'paid' : 'partially_paid';

        $payment->update([
            'paid_amount' => $newPaidTotal,
            'due_amount' => $dueAmount,
            'status' => $status,
            'payment_method' => $validated['payment_method'],
            'transaction_id' => $validated['transaction_id'] ?? $payment->transaction_id,
            'payment_date' => now()->toDateString(),
            'notes' => $validated['notes'] ?? $payment->notes,
        ]);

        $payment->load(['fundCollectionName', 'student']);

        return response()->json([
            'message' => "Payment settled successfully. Remaining due: {$dueAmount} BDT",
            'payment' => $payment,
        ]);
    }

    /**
     * Delete a payment record.
     */
    public function destroy(Payment $payment): JsonResponse
    {
        $this->authorizeTenant($payment);

        $payment->delete();

        return response()->json([
            'message' => 'Payment record deleted successfully.',
        ]);
    }

    /**
     * Generate and download professional PDF receipt for this payment.
     */
    public function downloadPdf(Payment $payment): Response
    {
        $this->authorizeTenant($payment);

        $payment->load([
            'fundCollectionName',
            'student.classLevel',
            'student.section',
            'school',
            'academicYear',
            'user',
        ]);

        $school = $payment->school ?? School::find($payment->school_id) ?? School::first();
        $academicYear = $payment->academicYear ?? AcademicYear::find($payment->academic_year_id) ?? AcademicYear::first();

        // Convert paid amount to English words
        $amountToSpell = (float) $payment->paid_amount;
        $amountInWords = 'Zero Taka Only';
        if ($amountToSpell > 0 && class_exists('NumberFormatter')) {
            try {
                $formatter = new NumberFormatter('en', NumberFormatter::SPELLOUT);
                $whole = floor($amountToSpell);
                $fraction = round(($amountToSpell - $whole) * 100);

                $words = ucwords($formatter->format($whole)) . ' Taka';
                if ($fraction > 0) {
                    $words .= ' and ' . ucwords($formatter->format($fraction)) . ' Paisa';
                }
                $amountInWords = $words . ' Only';
            } catch (\Throwable $e) {
                $amountInWords = 'Tk ' . number_format($amountToSpell, 2) . ' Only';
            }
        } elseif ($amountToSpell > 0) {
            $amountInWords = 'Tk ' . number_format($amountToSpell, 2) . ' Only';
        }

        $pdf = Pdf::loadView('pdf.payment_receipt', [
            'payment' => $payment,
            'school' => $school,
            'academicYear' => $academicYear,
            'amountInWords' => $amountInWords,
        ])->setPaper('a4', 'portrait');

        $fileName = "Receipt-{$payment->receipt_no}.pdf";

        return $pdf->download($fileName);
    }

    /**
     * Aggregate finance metrics for the current tenant.
     */
    public function stats(): JsonResponse
    {
        $payments = Payment::forTenant()->get();

        $totalBilled = $payments->sum('amount');
        $totalCollected = $payments->sum('paid_amount');
        $totalDue = $payments->sum('due_amount');

        return response()->json([
            'total_billed' => round($totalBilled, 2),
            'total_collected' => round($totalCollected, 2),
            'total_due' => round($totalDue, 2),
            'total_transactions' => $payments->count(),
            'paid_count' => $payments->where('status', 'paid')->count(),
            'due_count' => $payments->where('status', 'due')->count(),
            'partially_paid_count' => $payments->where('status', 'partially_paid')->count(),
        ]);
    }

    /**
     * Check tenant ownership.
     */
    protected function authorizeTenant(Payment $payment): void
    {
        if (auth()->check() && auth()->user()->school_id && $payment->school_id !== auth()->user()->school_id) {
            abort(403, 'Unauthorized access to this school tenant.');
        }
    }
}

