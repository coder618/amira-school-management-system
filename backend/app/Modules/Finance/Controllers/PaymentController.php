<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Models\Invoice;
use App\Modules\Finance\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'amount' => 'required|numeric|min:1',
            'payment_method' => 'required|in:Cash,bKash,Nagad,Bank',
            'transaction_id' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:255',
        ]);

        $invoice = Invoice::findOrFail($validated['invoice_id']);

        if ($validated['amount'] > $invoice->due_amount) {
            return response()->json([
                'message' => 'Payment amount cannot exceed the remaining due amount of ৳' . number_format($invoice->due_amount, 2),
            ], 422);
        }

        $payment = DB::transaction(function () use ($validated, $invoice) {
            $payment = Payment::create([
                'school_id' => $invoice->school_id,
                'invoice_id' => $invoice->id,
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'transaction_id' => $validated['transaction_id'] ?? null,
                'payment_date' => now(),
                'received_by' => auth()->user()->name ?? 'Accountant',
                'notes' => $validated['notes'] ?? null,
            ]);

            $newPaid = $invoice->paid_amount + $validated['amount'];
            $newDue = max(0, $invoice->amount - $newPaid);
            $newStatus = $newDue == 0 ? 'paid' : 'partially_paid';

            $invoice->update([
                'paid_amount' => $newPaid,
                'due_amount' => $newDue,
                'status' => $newStatus,
            ]);

            return $payment;
        });

        $invoice->load(['student', 'payments']);

        return response()->json([
            'message' => "Payment of ৳{$validated['amount']} recorded via {$validated['payment_method']}.",
            'payment' => $payment,
            'invoice' => $invoice,
        ], 201);
    }
}

