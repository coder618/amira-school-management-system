<?php

namespace App\Modules\Notification\Models;

use App\Modules\Core\Models\School;
use App\Modules\Core\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Notification extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'user_notifications';

    protected $fillable = [
        'user_id',
        'school_id',
        'title',
        'message',
        'type',
        'data',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'read_at' => 'datetime',
        ];
    }

    /**
     * User relationship (the recipient).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * School / Tenant relationship.
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Scope for specific user notifications.
     */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for unread notifications.
     */
    public function scopeUnread(Builder $query): Builder
    {
        return $query->whereNull('read_at');
    }

    /**
     * Scope for read notifications.
     */
    public function scopeRead(Builder $query): Builder
    {
        return $query->whereNotNull('read_at');
    }

    /**
     * Mark this notification as read.
     */
    public function markAsRead(): bool
    {
        if (is_null($this->read_at)) {
            $this->forceFill(['read_at' => now()])->save();
            return true;
        }

        return false;
    }

    /**
     * Mark this notification as unread.
     */
    public function markAsUnread(): bool
    {
        if (! is_null($this->read_at)) {
            $this->forceFill(['read_at' => null])->save();
            return true;
        }

        return false;
    }

    /**
     * Check if notification is read.
     */
    public function isRead(): bool
    {
        return ! is_null($this->read_at);
    }
}
