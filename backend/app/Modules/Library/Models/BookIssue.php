<?php

namespace App\Modules\Library\Models;

use App\Modules\Academic\Models\Student;
use App\Modules\Core\Models\User;
use App\Modules\Core\Traits\BelongsToTenant;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookIssue extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'book_issues';

    protected $fillable = [
        'school_id',
        'book_id',
        'student_id',
        'issued_by',
        'received_by',
        'issue_date',
        'due_date',
        'return_date',
        'status',
        'fine_amount',
        'fine_status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date:Y-m-d',
            'due_date' => 'date:Y-m-d',
            'return_date' => 'date:Y-m-d',
            'fine_amount' => 'decimal:2',
        ];
    }

    protected $appends = [
        'is_overdue',
        'days_overdue',
        'days_remaining',
    ];

    public function getIsOverdueAttribute(): bool
    {
        if ($this->status !== 'issued') {
            return false;
        }

        $due = Carbon::parse($this->due_date)->endOfDay();
        return now()->isAfter($due);
    }

    public function getDaysOverdueAttribute(): int
    {
        if ($this->status !== 'issued') {
            return 0;
        }

        $due = Carbon::parse($this->due_date)->startOfDay();
        $today = now()->startOfDay();

        return $today->isAfter($due) ? (int) $today->diffInDays($due) : 0;
    }

    public function getDaysRemainingAttribute(): int
    {
        if ($this->status !== 'issued') {
            return 0;
        }

        $due = Carbon::parse($this->due_date)->startOfDay();
        $today = now()->startOfDay();

        return $due->isAfter($today) ? (int) $today->diffInDays($due) : 0;
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class, 'book_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function issuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function scopeStatus(Builder $query, ?string $status): Builder
    {
        if (empty($status) || $status === 'all') {
            return $query;
        }

        if ($status === 'overdue') {
            return $query->where('status', 'issued')
                ->where('due_date', '<', now()->toDateString());
        }

        return $query->where('status', $status);
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (empty($term)) {
            return $query;
        }

        $term = trim($term);

        return $query->where(function (Builder $q) use ($term) {
            $q->whereHas('student', function (Builder $sq) use ($term) {
                $sq->where('first_name', 'like', "%{$term}%")
                    ->orWhere('last_name', 'like', "%{$term}%")
                    ->orWhere('student_id', 'like', "%{$term}%")
                    ->orWhere('roll_number', 'like', "%{$term}%");
            })
            ->orWhereHas('book', function (Builder $bq) use ($term) {
                $bq->where('title', 'like', "%{$term}%")
                    ->orWhere('author', 'like', "%{$term}%")
                    ->orWhere('isbn', 'like', "%{$term}%");
            });
        });
    }
}
