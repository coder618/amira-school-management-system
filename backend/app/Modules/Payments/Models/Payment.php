<?php

namespace App\Modules\Payments\Models;

use App\Modules\Academic\Models\Student;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\Core\Traits\BelongsToTenant;
use App\Modules\FundCollectionName\Models\FundCollectionName;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'payments';

    protected $fillable = [
        'school_id',
        'academic_year_id',
        'fund_collection_name_id',
        'student_id',
        'invoice_id',
        'user_id',
        'receipt_no',
        'amount',
        'paid_amount',
        'due_amount',
        'status', // paid, due, partially_paid, cancelled
        'payment_method', // Cash, bKash, Nagad, Bank, Rocket
        'transaction_id',
        'payment_date',
        'due_date',
        'received_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'due_amount' => 'decimal:2',
            'payment_date' => 'date:Y-m-d',
            'due_date' => 'date:Y-m-d',
        ];
    }

    public function fundCollectionName(): BelongsTo
    {
        return $this->belongsTo(FundCollectionName::class, 'fund_collection_name_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Invoice\Models\Invoice::class, 'invoice_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Core\Models\User::class, 'user_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }
}

