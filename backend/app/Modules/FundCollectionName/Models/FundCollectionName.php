<?php

namespace App\Modules\FundCollectionName\Models;

use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use App\Modules\Core\Traits\BelongsToTenant;
use App\Modules\Payments\Models\Payment;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FundCollectionName extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'fund_collection_names';

    protected $fillable = [
        'school_id',
        'academic_year_id',
        'name',
        'interval', // Monthly, Quarterly, 6 Months, Yearly, One-Time
        'default_amount',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'default_amount' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'fund_collection_name_id');
    }
}

