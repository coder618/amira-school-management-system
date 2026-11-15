<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Result Slip - {{ $student->first_name }} {{ $student->last_name }} (Roll #{{ $student->roll_number }})</title>
    <style>
        @page {
            size: a4 portrait;
            margin: 15mm 16mm 15mm 16mm;
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

        .slip-wrapper {
            width: 100%;
            page-break-inside: avoid;
        }

        /* Top Institutional Header */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2.5px solid #2563eb;
            padding-bottom: 8px;
            margin-bottom: 12px;
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
            font-size: 8px;
            font-weight: bold;
            padding: 2px 7px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
        }

        .voucher-title {
            font-size: 14px;
            font-weight: bold;
            color: #0f172a;
            letter-spacing: 0.5px;
        }

        .voucher-sub {
            font-size: 8px;
            color: #64748b;
            margin-top: 1px;
        }

        /* Student Credentials Grid */
        .student-card {
            width: 100%;
            border-collapse: collapse;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            margin-bottom: 12px;
        }

        .student-card td {
            padding: 7px 10px;
            font-size: 9px;
            border-bottom: 1px solid #f1f5f9;
        }

        .student-card .label {
            font-size: 8px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            width: 15%;
        }

        .student-card .value {
            font-size: 9.5px;
            font-weight: bold;
            color: #0f172a;
            width: 35%;
        }

        /* Performance Overview Cards */
        .overview-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }

        .overview-card {
            background-color: #ffffff;
            border: 1.5px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 10px;
            text-align: center;
        }

        .overview-title {
            font-size: 7.5px;
            font-weight: bold;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }

        .overview-val {
            font-size: 14px;
            font-weight: bold;
            font-family: monospace, 'DejaVu Sans Mono', 'DejaVu Sans';
        }

        /* Marks Breakdown Table */
        .marks-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }

        .marks-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            padding: 7px 8px;
            border: 1px solid #cbd5e1;
            text-align: center;
        }

        .marks-table th.subject-col {
            text-align: left;
            width: 36%;
        }

        .marks-table td {
            padding: 6px 8px;
            font-size: 9px;
            border: 1px solid #e2e8f0;
            text-align: center;
        }

        .marks-table td.subject-col {
            text-align: left;
            font-weight: bold;
            color: #1e293b;
        }

        .marks-table tr:nth-child(even) {
            background-color: #f8fafc;
        }

        .marks-table .total-row {
            background-color: #eff6ff !important;
            font-weight: bold;
        }

        .marks-table .total-row td {
            border-top: 1.5px solid #93c5fd;
            font-size: 9.5px;
        }

        /* Grade Badges */
        .grade-badge {
            display: inline-block;
            font-size: 8px;
            font-weight: bold;
            padding: 1.5px 6px;
            border-radius: 3px;
        }

        .grade-aplus { background-color: #dcfce7; color: #15803d; border: 1px solid #86efac; }
        .grade-a { background-color: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; }
        .grade-aminus { background-color: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .grade-b { background-color: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
        .grade-c { background-color: #ffedd5; color: #9a3412; border: 1px solid #fdba74; }
        .grade-d { background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
        .grade-f { background-color: #ffe4e6; color: #9f1239; border: 1px solid #fda4af; }

        /* Secondary Bottom Block: Grading Key & Notes */
        .bottom-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
        }

        .bottom-table td {
            vertical-align: top;
        }

        .scale-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7.5px;
        }

        .scale-table th {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 2.5px 4px;
            text-align: center;
            font-weight: bold;
        }

        .scale-table td {
            border: 1px solid #e2e8f0;
            padding: 2px 4px;
            text-align: center;
        }

        .notes-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 6px 8px;
            font-size: 7.5px;
            color: #475569;
            line-height: 1.35;
        }

        /* Signatures */
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 30px;
            margin-bottom: 12px;
        }

        .signatures-table td {
            width: 33.33%;
            text-align: center;
            vertical-align: bottom;
            padding: 0 15px;
        }

        .sig-line {
            border-top: 1px dashed #94a3b8;
            padding-top: 4px;
            font-size: 8px;
            font-weight: bold;
            color: #334155;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .sig-sub {
            font-size: 7px;
            color: #94a3b8;
            margin-top: 1px;
        }

        /* Footer */
        .footer-note {
            border-top: 1px solid #e2e8f0;
            padding-top: 5px;
            text-align: center;
            font-size: 7px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="slip-wrapper">
        <!-- Official Institutional Header -->
        <table class="header-table">
            <tr>
                <td style="width: 62%;">
                    <div class="school-name">{{ $school->name ?? 'EduCore Model High School & College' }}</div>
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
                <td style="width: 38%; text-align: right;">
                    <div class="voucher-badge">Academic Transcript</div>
                    <div class="voucher-title">RESULT SLIP</div>
                    <div class="voucher-sub">{{ $exam->name }} ({{ $exam->term }})</div>
                    <div class="voucher-sub">Session: {{ $exam->academicYear?->title ?? date('Y') }}</div>
                </td>
            </tr>
        </table>

        <!-- Student Credentials Grid -->
        <table class="student-card">
            <tr>
                <td class="label">Student Name:</td>
                <td class="value">{{ $student->first_name }} {{ $student->last_name }}</td>
                <td class="label">Student ID:</td>
                <td class="value" style="font-family: monospace;">{{ $student->student_id }}</td>
            </tr>
            <tr>
                <td class="label">Class & Level:</td>
                <td class="value">{{ $student->classLevel?->name ?? 'Class Level' }}</td>
                <td class="label">Section / Shift:</td>
                <td class="value">{{ $student->section?->name ?? 'A' }} @if($student->shift) ({{ $student->shift->name }}) @endif</td>
            </tr>
            <tr>
                <td class="label">Roll Number:</td>
                <td class="value font-mono">#{{ $student->roll_number }}</td>
                <td class="label">Merit Position:</td>
                <td class="value font-mono">
                    @if(!empty($rank))
                        Rank #{{ $rank }}
                    @else
                        —
                    @endif
                </td>
            </tr>
        </table>

        <!-- Overall Performance Cards -->
        <table class="overview-table">
            <tr>
                <td style="width: 25%; padding-right: 4px;">
                    <div class="overview-card" style="border-color: #cbd5e1;">
                        <div class="overview-title">Total Marks Obtained</div>
                        <div class="overview-val" style="color: #0f172a;">{{ $totalMarksObtained }}</div>
                    </div>
                </td>
                <td style="width: 25%; padding: 0 2px;">
                    <div class="overview-card" style="border-color: #93c5fd; background-color: #f8fafc;">
                        <div class="overview-title" style="color: #2563eb;">Composite GPA</div>
                        <div class="overview-val" style="color: #1d4ed8;">{{ number_format($finalGpa, 2) }}</div>
                    </div>
                </td>
                <td style="width: 25%; padding: 0 2px;">
                    <div class="overview-card" style="border-color: #86efac; background-color: #f8fafc;">
                        <div class="overview-title" style="color: #16a34a;">Final Grade</div>
                        <div class="overview-val" style="color: #15803d;">{{ $finalGrade }}</div>
                    </div>
                </td>
                <td style="width: 25%; padding-left: 4px;">
                    <div class="overview-card" style="border-color: {{ $passed ? '#86efac' : '#fca5a5' }}; background-color: {{ $passed ? '#f0fdf4' : '#fef2f2' }};">
                        <div class="overview-title" style="color: {{ $passed ? '#166534' : '#991b1b' }};">Result Status</div>
                        <div class="overview-val" style="color: {{ $passed ? '#15803d' : '#dc2626' }};">
                            {{ $passed ? 'PASSED' : 'FAILED' }}
                        </div>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Subject Breakdown Table -->
        <table class="marks-table">
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th class="subject-col">Subject Name</th>
                    <th style="width: 10%;">CQ / Creative</th>
                    <th style="width: 10%;">MCQ / Obj</th>
                    <th style="width: 10%;">Practical</th>
                    <th style="width: 11%;">Total Marks</th>
                    <th style="width: 9%;">Grade</th>
                    <th style="width: 9%;">GPA</th>
                </tr>
            </thead>
            <tbody>
                @forelse($marks as $index => $mark)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td class="subject-col">
                            {{ $mark->subject?->name ?? 'Subject' }}
                            @if($mark->is_4th_subject)
                                <span style="font-size: 7px; color: #4338ca; font-weight: normal; background-color: #e0e7ff; padding: 1px 4px; border-radius: 2px;">4th Subject</span>
                            @endif
                        </td>
                        <td style="font-family: monospace;">{{ $mark->subjective_mark !== null ? (float)$mark->subjective_mark : '-' }}</td>
                        <td style="font-family: monospace;">{{ $mark->objective_mark !== null ? (float)$mark->objective_mark : '-' }}</td>
                        <td style="font-family: monospace;">{{ $mark->practical_mark !== null ? (float)$mark->practical_mark : '-' }}</td>
                        <td style="font-family: monospace; font-weight: bold; color: #0f172a;">{{ (float)$mark->total_mark }}</td>
                        <td>
                            @php
                                $gClass = match(strtoupper($mark->grade)) {
                                    'A+' => 'grade-aplus',
                                    'A'  => 'grade-a',
                                    'A-' => 'grade-aminus',
                                    'B'  => 'grade-b',
                                    'C'  => 'grade-c',
                                    'D'  => 'grade-d',
                                    default => 'grade-f',
                                };
                            @endphp
                            <span class="grade-badge {{ $gClass }}">{{ $mark->grade }}</span>
                        </td>
                        <td style="font-family: monospace; font-weight: bold;">{{ number_format((float)$mark->gpa, 2) }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="8" style="padding: 15px; color: #94a3b8;">No subject marks recorded for this examination.</td>
                    </tr>
                @endforelse

                @if($marks->count() > 0)
                    <tr class="total-row">
                        <td colspan="2" style="text-align: right; padding-right: 12px; text-transform: uppercase;">Aggregated Summary:</td>
                        <td colspan="3" style="font-size: 8px; color: #475569;">{{ $marks->count() }} Subjects Assessed</td>
                        <td style="font-family: monospace;">{{ $totalMarksObtained }}</td>
                        <td>
                            <span class="grade-badge {{ $passed ? 'grade-aplus' : 'grade-f' }}">{{ $finalGrade }}</span>
                        </td>
                        <td style="font-family: monospace;">{{ number_format($finalGpa, 2) }}</td>
                    </tr>
                @endif
            </tbody>
        </table>

        <!-- Grading Legend & Official Remarks Block -->
        <table class="bottom-table">
            <tr>
                <td style="width: 58%; padding-right: 8px;">
                    <div style="font-size: 7.5px; font-weight: bold; text-transform: uppercase; color: #475569; margin-bottom: 3px;">
                        Standard NCTB Grading Scale
                    </div>
                    <table class="scale-table">
                        <tr>
                            <th>Range</th>
                            <th>Grade</th>
                            <th>GPA</th>
                            <th>Range</th>
                            <th>Grade</th>
                            <th>GPA</th>
                        </tr>
                        <tr>
                            <td>80% - 100%</td>
                            <td><strong style="color: #15803d;">A+</strong></td>
                            <td>5.00</td>
                            <td>50% - 59%</td>
                            <td><strong style="color: #854d0e;">B</strong></td>
                            <td>3.00</td>
                        </tr>
                        <tr>
                            <td>70% - 79%</td>
                            <td><strong style="color: #0369a1;">A</strong></td>
                            <td>4.00</td>
                            <td>40% - 49%</td>
                            <td><strong style="color: #c2410c;">C</strong></td>
                            <td>2.00</td>
                        </tr>
                        <tr>
                            <td>60% - 69%</td>
                            <td><strong style="color: #166534;">A-</strong></td>
                            <td>3.50</td>
                            <td>33% - 39%</td>
                            <td><strong style="color: #b91c1c;">D</strong></td>
                            <td>1.00</td>
                        </tr>
                        <tr>
                            <td colspan="3">Below 33%: <strong style="color: #be123c;">F (Fail - 0.00)</strong></td>
                            <td colspan="3">Pass Mark per subject: <strong>33%</strong></td>
                        </tr>
                    </table>
                </td>
                <td style="width: 42%; padding-left: 8px;">
                    <div style="font-size: 7.5px; font-weight: bold; text-transform: uppercase; color: #475569; margin-bottom: 3px;">
                        Institutional Performance Remarks
                    </div>
                    <div class="notes-box">
                        @if($passed)
                            @if($finalGpa >= 5.0)
                                <strong>Outstanding Performance!</strong> The student has attained an exemplary GPA of 5.00 (A+) with exceptional academic distinction across all disciplines.
                            @elseif($finalGpa >= 4.0)
                                <strong>Commendable Achievement!</strong> The student has demonstrated solid mastery and achieved Grade A standing in this examination cycle.
                            @else
                                <strong>Good Effort!</strong> The student has passed the examination. Continued diligence in targeted subjects will foster further academic advancement.
                            @endif
                        @else
                            <strong style="color: #dc2626;">Academic Remediation Required:</strong> The student did not meet minimum qualifying benchmarks in one or more compulsory subjects. Immediate scholastic guidance advised.
                        @endif
                        @if(!empty($fourthSubjectBonus) && $fourthSubjectBonus > 0)
                            <div style="margin-top: 3px; font-size: 7px; color: #4338ca;">
                                • Includes 4th subject bonus credit: <strong>+{{ number_format($fourthSubjectBonus, 2) }}</strong> points above base GPA 2.0.
                            </div>
                        @endif
                    </div>
                </td>
            </tr>
        </table>

        <!-- Formal Signatures -->
        <table class="signatures-table">
            <tr>
                <td>
                    <div class="sig-line">Class Teacher</div>
                    <div class="sig-sub">Prepared & Verified By</div>
                </td>
                <td>
                    <div class="sig-line">Exam Controller</div>
                    <div class="sig-sub">Tabulation Committee</div>
                </td>
                <td>
                    <div class="sig-line">Headmaster / Principal</div>
                    <div class="sig-sub">{{ $school->name ?? 'EduCore Authority' }}</div>
                </td>
            </tr>
        </table>

        <!-- Footer -->
        <div class="footer-note">
            This is an electronically generated authentic academic result transcript issued by {{ $school->name ?? 'EduCore School Management System' }}.
            <br/>
            Printed on: {{ now()->timezone('Asia/Dhaka')->format('d M, Y h:i A') }} (BST) &nbsp;|&nbsp; Student Code: {{ $student->student_id }} &nbsp;|&nbsp; System Ref: #EXAM-{{ $exam->id }}-STU-{{ $student->id }}
        </div>
    </div>
</body>
</html>
