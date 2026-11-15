<?php

namespace App\Modules\Core\Models;

use App\Modules\Core\Enums\Role;
use App\Modules\Notification\Models\Notification;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';

    protected $fillable = [
        'school_id',
        'name',
        'email',
        'password',
        'role',
        'phone_number',
        'card_rfid',
        'profile_picture',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = [
        'profile_picture_url',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the full URL to the user profile picture.
     */
    public function getProfilePictureUrlAttribute(): ?string
    {
        if (empty($this->profile_picture)) {
            return null;
        }

        if (str_starts_with($this->profile_picture, 'http://') || str_starts_with($this->profile_picture, 'https://') || str_starts_with($this->profile_picture, 'data:')) {
            return $this->profile_picture;
        }

        return url('storage/' . ltrim(preg_replace('#^/?storage/#', '', $this->profile_picture), '/'));
    }

    /**
     * School / Tenant relationship.
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * User's notifications (Soft-deletable personal notifications).
     */
    public function appNotifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * User's uploaded media files via Media module.
     */
    public function media(): HasMany
    {
        return $this->hasMany(\App\Modules\Media\Models\Media::class, 'user_id');
    }

    /**
     * Invoices issued directly to this user.
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(\App\Modules\Invoice\Models\Invoice::class);
    }

    /**
     * Role checking helpers.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === Role::SuperAdmin->value;
    }

    public function isAdmin(): bool
    {
        return $this->role === Role::Admin->value;
    }

    public function isTeacher(): bool
    {
        return $this->role === Role::Teacher->value;
    }

    public function isStudentParent(): bool
    {
        return $this->role === Role::StudentParent->value;
    }
}

