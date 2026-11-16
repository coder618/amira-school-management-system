<?php

namespace App\Modules\Attendance\Models;

use App\Modules\Core\Models\User;
use App\Modules\Core\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Holiday extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'holidays';

    protected $fillable = [
        'school_id',
        'academic_year_id',
        'title',
        'date',
        'end_date',
        'type',
        'description',
        'is_half_day',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'is_half_day' => 'boolean',
        ];
    }

    /**
     * User who recorded this holiday.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope for a specific date (single date or within date - end_date range).
     */
    public function scopeOnDate(Builder $query, string $date): Builder
    {
        return $query->where(function (Builder $q) use ($date) {
            $q->where('date', $date)
                ->orWhere(function (Builder $sub) use ($date) {
                    $sub->whereNotNull('end_date')
                        ->where('date', '<=', $date)
                        ->where('end_date', '>=', $date);
                });
        });
    }

    /**
     * Scope query to a specific calendar year.
     */
    public function scopeInYear(Builder $query, int $year): Builder
    {
        return $query->where(function (Builder $q) use ($year) {
            $q->whereYear('date', $year)
                ->orWhere(function (Builder $sub) use ($year) {
                    $sub->whereNotNull('end_date')
                        ->whereYear('end_date', $year);
                });
        });
    }

    /**
     * Scope query to a specific year and month.
     */
    public function scopeInMonth(Builder $query, int $year, int $month): Builder
    {
        $startDate = sprintf('%04d-%02d-01', $year, $month);
        $endDate = date('Y-m-t', strtotime($startDate));

        return $query->where(function (Builder $q) use ($startDate, $endDate) {
            $q->whereBetween('date', [$startDate, $endDate])
                ->orWhere(function (Builder $sub) use ($startDate, $endDate) {
                    $sub->whereNotNull('end_date')
                        ->where('date', '<=', $endDate)
                        ->where('end_date', '>=', $startDate);
                });
        });
    }
}
