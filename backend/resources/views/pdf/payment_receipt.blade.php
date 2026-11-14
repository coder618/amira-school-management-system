<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Receipt #{{ $payment->receipt_no }}</title>
    <style>
        @page {
            size: a4 portrait;
            margin: 20mm 18mm 18mm 18mm;
        }

        * {
            box-sizing: border-box;
            -webkit-box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 9.5px;
            line-height: 1.4;
            color: #1e293b;
            background-color: #ffffff;
        }

        .receipt-wrapper {
            width: 100%;
            page-break-inside: avoid;
        }

        /* Top Institutional Header */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
            margin-bottom: 14px;
        }

        .header-table td {
            vertical-align: top;
        }

        .school-name {
            font-size: 18px;
            font-weight: bold;
            color: #1e3a8a;
            margin-bottom: 3px;
            letter-spacing: -0.2px;
        }

        .school-meta {
            font-size: 8.5px;
            color: #475569;
            margin-bottom: 2px;
        }

        .school-contact {
            font-size: 8px;
            color: #64748b;
        }

        .voucher-badge {
            display: inline-block;
            background-color: #eff6ff;
            color: #1d4ed8;
            border: 1px solid #bfdbfe;
            font-size: 8.5px;
            font-weight: bold;
            padding: 2.5px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }

        .voucher-title {
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
            font-family: monospace, 'DejaVu Sans Mono', 'DejaVu Sans';
        }

        .voucher-sub {
            font-size: 8px;
            color: #64748b;
            margin-top: 1px;
        }

        /* Status Badges */
        .status-badge {
            display: inline-block;
            padding: 2px 7px;
            font-size: 8px;
            font-weight: bold;
            border-radius: 999px;
            text-transform: uppercase;
            vertical-align: middle;
            margin-left: 4px;
        }

        .status-paid {
            background-color: #ecfdf5;
            color: #15803d;
            border: 1px solid #86efac;
        }

        .status-partially_paid {
            background-color: #fffbeb;
            color: #b45309;
            border: 1px solid #fde68a;
        }

        .status-due {
            background-color: #fef2f2;
            color: #b91c1c;
            border: 1px solid #fecaca;
        }

        .status-cancelled {
            background-color: #f1f5f9;
            color: #475569;
            border: 1px solid #cbd5e1;
        }

        /* Payee Information Card */
        .payee-card {
            width: 100%;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 9px 12px;
            margin-bottom: 12px;
        }

        .section-tag {
            font-size: 7.5px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
        }

        .payee-name {
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 2px;
        }

        .payee-meta {
            font-size: 9px;
            color: #475569;
        }

        .payee-meta strong {
            color: #0f172a;
        }

        /* Amount Overview Card (Clean Professional Light Design) */
        .amount-card {
            width: 100%;
            border-collapse: collapse;
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            margin-bottom: 12px;
        }

        .amount-card td {
            width: 33.33%;
            padding: 10px 14px;
            vertical-align: middle;
        }

        .amount-card-divider {
            border-right: 1px solid #e2e8f0;
        }

        .amount-card-tag {
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }

        .amount-card-val {
            font-size: 15px;
            font-weight: bold;
            font-family: monospace, 'DejaVu Sans Mono', 'DejaVu Sans';
        }

        /* 2x2 Grid Info Boxes */
        .grid-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        .grid-col {
            width: 50%;
            vertical-align: top;
        }

        .grid-col-left {
            padding-right: 6px;
            padding-bottom: 10px;
        }

        .grid-col-right {
            padding-left: 6px;
            padding-bottom: 10px;
        }

        .info-box {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 11px;
            height: 48px;
        }

        .info-box-title {
            font-size: 7.5px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }

        .info-box-main {
            font-size: 10px;
            font-weight: bold;
            color: #0f172a;
        }

        .info-box-sub {
            font-size: 8.5px;
            color: #64748b;
            margin-top: 1px;
        }

        /* Remarks Box */
        .remarks-box {
            background-color: #fffbeb;
            border: 1px solid #fef08a;
            border-radius: 6px;
            padding: 8px 11px;
            margin-bottom: 12px;
        }

        .remarks-title {
            font-size: 7.5px;
            font-weight: bold;
            color: #b45309;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }

        .remarks-text {
            font-size: 9px;
            color: #78350f;
            line-height: 1.35;
        }

        /* Words & Session Bar */
        .words-table {
            width: 100%;
            border-collapse: collapse;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            margin-bottom: 22px;
        }

        .words-table td {
            padding: 7px 11px;
            font-size: 8.5px;
        }

        /* Signatures */
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 40px;
            margin-bottom: 18px;
        }

        .signatures-table td {
            width: 50%;
            text-align: center;
            vertical-align: bottom;
            padding: 0 25px;
        }

        .sig-line {
            border-top: 1px dashed #94a3b8;
            padding-top: 5px;
            font-size: 8.5px;
            font-weight: bold;
            color: #334155;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .sig-sub {
            font-size: 7.5px;
            color: #94a3b8;
            margin-top: 1px;
        }

        /* Footer */
        .footer-note {
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
            text-align: center;
            font-size: 7.5px;
            color: #94a3b8;
            line-height: 1.35;
        }
    </style>
</head>
<body>
    <div class="receipt-wrapper">
        <!-- School & Receipt Title Header -->
        <table class="header-table">
            <tr>
                <td style="width: 58%;">
                    <div class="school-name">{{ $school->name ?? 'EduCore Model School & College' }}</div>
                    <div class="school-meta">
                        @if(!empty($school->eiin))
                            <strong>EIIN:</strong> {{ $school->eiin }} &nbsp;|&nbsp;
                        @endif
                        @if(!empty($school->code))
                            <strong>Code:</strong> {{ $school->code }} &nbsp;|&nbsp;
                        @endif
                        @if(!empty($school->board))
                            <strong>Board:</strong> {{ $school->board }}
                        @endif
                    </div>
                    <div class="school-contact">
                        {{ $school->address ?? 'Institutional Campus Area' }}
                        @if(!empty($school->phone))
                            &nbsp;•&nbsp; <strong>Tel:</strong> {{ $school->phone }}
                        @endif
                        @if(!empty($school->email))
                            &nbsp;•&nbsp; <strong>Email:</strong> {{ $school->email }}
                        @endif
                    </div>
                </td>
                <td style="width: 42%; text-align: right;">
                    <div class="voucher-badge">Payment Voucher</div>
                    <div class="voucher-title">
                        Receipt #{{ $payment->receipt_no }}
                        @if($payment->status === 'paid')
                            <span class="status-badge status-paid">Paid</span>
                        @elseif($payment->status === 'partially_paid')
                            <span class="status-badge status-partially_paid">Partially Paid</span>
                        @elseif($payment->status === 'due')
                            <span class="status-badge status-due">Due</span>
                        @else
                            <span class="status-badge status-cancelled">{{ ucfirst($payment->status) }}</span>
                        @endif
                    </div>
                    <div class="voucher-sub">Official Payment Transaction Voucher</div>
                </td>
            </tr>
        </table>

        <!-- Payee Information -->
        <div class="payee-card">
            <div class="section-tag">Payee Information</div>
            @if($payment->student)
                <div class="payee-name">{{ $payment->student->first_name }} {{ $payment->student->last_name }}</div>
                <div class="payee-meta">
                    Student ID: <strong>{{ $payment->student->student_id }}</strong>
                    @if(!empty($payment->student->roll_number))
                        &nbsp;&nbsp;•&nbsp;&nbsp; Roll: <strong>{{ $payment->student->roll_number }}</strong>
                    @endif
                    @if(!empty($payment->student->classLevel->name))
                        &nbsp;&nbsp;•&nbsp;&nbsp; Class: <strong>{{ $payment->student->classLevel->name }}</strong>
                    @endif
                    @if(!empty($payment->student->section->name))
                        ({{ $payment->student->section->name }})
                    @endif
                    @if(!empty($payment->student->phone_number))
                        &nbsp;&nbsp;•&nbsp;&nbsp; Phone: <strong>{{ $payment->student->phone_number }}</strong>
                    @endif
                </div>
            @elseif($payment->user)
                <div class="payee-name">{{ $payment->user->name }}</div>
                <div class="payee-meta">
                    {{ $payment->user->email }} &nbsp;•&nbsp; Role: <strong>{{ ucfirst($payment->user->role) }}</strong>
                </div>
            @else
                <div class="payee-name">General Walk-in Payee</div>
            @endif
        </div>

        <!-- Amount Overview Card (Clean Professional Theme - No Black Fill) -->
        <table class="amount-card">
            <tr>
                <td class="amount-card-divider">
                    <div class="amount-card-tag" style="color: #64748b;">Total Bill</div>
                    <div class="amount-card-val" style="color: #0f172a;">Tk {{ number_format((float) $payment->amount, 2) }}</div>
                </td>
                <td class="amount-card-divider">
                    <div class="amount-card-tag" style="color: #059669;">Paid Amount</div>
                    <div class="amount-card-val" style="color: #059669;">Tk {{ number_format((float) $payment->paid_amount, 2) }}</div>
                </td>
                <td>
                    <div class="amount-card-tag" style="color: {{ (float) $payment->due_amount > 0 ? '#dc2626' : '#64748b' }};">Outstanding Due</div>
                    <div class="amount-card-val" style="color: {{ (float) $payment->due_amount > 0 ? '#dc2626' : '#64748b' }};">Tk {{ number_format((float) $payment->due_amount, 2) }}</div>
                </td>
            </tr>
        </table>

        <!-- 2x2 Metadata Grid -->
        <table class="grid-table">
            <tr>
                <td class="grid-col grid-col-left">
                    <div class="info-box">
                        <div class="info-box-title">Collection Category</div>
                        <div class="info-box-main">{{ $payment->fundCollectionName->name ?? 'General Tuition & School Fee' }}</div>
                        @if(!empty($payment->fundCollectionName->interval))
                            <div class="info-box-sub">Interval: {{ $payment->fundCollectionName->interval }}</div>
                        @endif
                    </div>
                </td>
                <td class="grid-col grid-col-right">
                    <div class="info-box">
                        <div class="info-box-title">Payment Gateway & TrxID</div>
                        <div class="info-box-main">
                            Method: <span style="color: #2563eb;">{{ $payment->payment_method ?? 'Cash' }}</span>
                        </div>
                        @if(!empty($payment->transaction_id))
                            <div class="info-box-sub font-mono">TrxID: {{ $payment->transaction_id }}</div>
                        @else
                            <div class="info-box-sub">TrxID: — (Cash / Direct)</div>
                        @endif
                    </div>
                </td>
            </tr>
            <tr>
                <td class="grid-col grid-col-left">
                    <div class="info-box">
                        <div class="info-box-title">Payment Date</div>
                        <div class="info-box-main">
                            {{ $payment->payment_date ? \Carbon\Carbon::parse($payment->payment_date)->format('Y-m-d') : ($payment->created_at ? $payment->created_at->format('Y-m-d') : date('Y-m-d')) }}
                        </div>
                        <div class="info-box-sub">Received by: {{ $payment->received_by ?? 'Accounts Staff' }}</div>
                    </div>
                </td>
                <td class="grid-col grid-col-right">
                    <div class="info-box">
                        <div class="info-box-title">Due Date</div>
                        <div class="info-box-main">
                            {{ $payment->due_date ? \Carbon\Carbon::parse($payment->due_date)->format('Y-m-d') : '—' }}
                        </div>
                        <div class="info-box-sub">Session: {{ $academicYear->title ?? date('Y') }}</div>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Remarks / Notes (if present) -->
        @if(!empty($payment->notes))
        <div class="remarks-box">
            <div class="remarks-title">Remarks / Notes</div>
            <div class="remarks-text">{{ $payment->notes }}</div>
        </div>
        @endif

        <!-- Amount in Words & Academic Session Bar -->
        <table class="words-table">
            <tr>
                <td style="width: 70%;">
                    <span style="color: #64748b; font-weight: bold; text-transform: uppercase;">Amount in words:</span>
                    <strong style="color: #0f172a; margin-left: 4px;">{{ $amountInWords }}</strong>
                </td>
                <td style="width: 30%; text-align: right; color: #64748b;">
                    Session: <strong>{{ $academicYear->title ?? date('Y') }}</strong>
                </td>
            </tr>
        </table>

        <!-- Dual Formal Signatures -->
        <table class="signatures-table">
            <tr>
                <td>
                    <div class="sig-line">Student / Depositor Signature</div>
                    <div class="sig-sub">Acknowledgement</div>
                </td>
                <td>
                    <div class="sig-line">Authorized Signatory / Accounts</div>
                    <div class="sig-sub">{{ $school->name ?? 'EduCore Authority' }}</div>
                </td>
            </tr>
        </table>

        <!-- Official Footer -->
        <div class="footer-note">
            This is an electronically generated official payment voucher issued by EduCore School Management System.
            <br/>
            Printed on: {{ now()->timezone('Asia/Dhaka')->format('d M, Y h:i A') }} (BST) &nbsp;|&nbsp; Voucher Reference: #{{ $payment->receipt_no }}
        </div>
    </div>
</body>
</html>
