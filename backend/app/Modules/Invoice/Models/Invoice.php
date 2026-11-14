<?php

namespace App\Modules\Invoice\Models;

use App\Modules\Academic\Models\Student;
use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use App\Modules\Core\Traits\BelongsToTenant;
use App\Modules\FundCollectionName\Models\FundCollectionName;
use App\Modules\Payments\Models\Payment;
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
        'user_id',
        'student_id',
        'fund_collection_name_id',
        'invoice_no',
        'title',
        'amount',
        'paid_amount',
        'due_amount',
        'status', // paid, partially_paid, due
        'payment_method',
        'transaction_id',
        'due_date',
        'notes',
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

    /**
     * An invoice belongs strictly to a user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function fundCollectionName(): BelongsTo
    {
        return $this->belongsTo(FundCollectionName::class, 'fund_collection_name_id');
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    /**
     * Payments generated when this invoice is paid (or partially paid).
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'invoice_id')->orderBy('id', 'desc');
    }
}
