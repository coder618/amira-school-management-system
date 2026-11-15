<?php

namespace App\Modules\Library\Models;

use App\Modules\Core\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Book extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'books';

    protected $fillable = [
        'school_id',
        'title',
        'author',
        'isbn',
        'category',
        'publisher',
        'edition',
        'publication_year',
        'total_copies',
        'available_copies',
        'rack_number',
        'description',
        'cover_image',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'total_copies' => 'integer',
            'available_copies' => 'integer',
        ];
    }

    protected $appends = [
        'is_available',
        'borrowed_copies',
    ];

    public function getIsAvailableAttribute(): bool
    {
        return $this->available_copies > 0 && $this->status === 'available';
    }

    public function getBorrowedCopiesAttribute(): int
    {
        return max(0, $this->total_copies - $this->available_copies);
    }

    public function bookIssues(): HasMany
    {
        return $this->hasMany(BookIssue::class, 'book_id');
    }

    public function activeIssues(): HasMany
    {
        return $this->hasMany(BookIssue::class, 'book_id')->where('status', 'issued');
    }

    /**
     * Scope for text search.
     */
    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (empty($term)) {
            return $query;
        }

        $term = trim($term);

        return $query->where(function (Builder $q) use ($term) {
            $q->where('title', 'like', "%{$term}%")
                ->orWhere('author', 'like', "%{$term}%")
                ->orWhere('isbn', 'like', "%{$term}%")
                ->orWhere('category', 'like', "%{$term}%")
                ->orWhere('publisher', 'like', "%{$term}%")
                ->orWhere('rack_number', 'like', "%{$term}%");
        });
    }

    /**
     * Scope for category filtering.
     */
    public function scopeCategory(Builder $query, ?string $category): Builder
    {
        if (empty($category) || $category === 'all') {
            return $query;
        }

        return $query->where('category', $category);
    }

    /**
     * Scope for availability filtering.
     */
    public function scopeAvailability(Builder $query, ?string $availability): Builder
    {
        if (empty($availability) || $availability === 'all') {
            return $query;
        }

        if ($availability === 'available') {
            return $query->where('available_copies', '>', 0)->where('status', 'available');
        }

        if ($availability === 'out_of_stock') {
            return $query->where(function (Builder $q) {
                $q->where('available_copies', '<=', 0)->orWhere('status', '!=', 'available');
            });
        }

        return $query;
    }
}
