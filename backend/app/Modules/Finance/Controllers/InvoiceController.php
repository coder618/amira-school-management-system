<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Invoice::with(['student.classLevel', 'feeCategory', 'payments'])
            ->forTenant();

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->query('student_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $invoices = $query->orderBy('id', 'desc')->get();

        return response()->json($invoices);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'fee_category_id' => 'nullable|exists:fee_categories,id',
            'title' => 'required|string|max:150',
            'amount' => 'required|numeric|min:1',
            'due_date' => 'required|date',
        ]);

        $invoiceNumber = 'INV-' . date('Y') . '-' . strtoupper(bin2hex(random_bytes(3)));

        $invoice = Invoice::create([
            'student_id' => $validated['student_id'],
            'fee_category_id' => $validated['fee_category_id'] ?? null,
            'invoice_number' => $invoiceNumber,
            'title' => $validated['title'],
            'amount' => $validated['amount'],
            'paid_amount' => 0.00,
            'due_amount' => $validated['amount'],
            'due_date' => $validated['due_date'],
            'status' => 'unpaid',
        ]);

        $invoice->load(['student', 'feeCategory']);

        return response()->json([
            'message' => 'Invoice generated successfully',
            'data' => $invoice,
        ], 201);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        $invoice->load(['student', 'feeCategory', 'payments']);

        return response()->json($invoice);
    }
}

