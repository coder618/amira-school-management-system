<?php

namespace App\Modules\Finance\Models;

use App\Modules\Academic\Models\Student;
use App\Modules\Core\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'invoices';

    protected $fillable = [
        'school_id',
        'academic_year_id',
        'student_id',
        'fee_category_id',
        'invoice_number',
        'title',
        'amount',
        'paid_amount',
        'due_amount',
        'due_date',
        'status', // unpaid, partially_paid, paid
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'due_amount' => 'decimal:2',
            'due_date' => 'date:Y-m-d',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function feeCategory(): BelongsTo
    {
        return $this->belongsTo(FeeCategory::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}

