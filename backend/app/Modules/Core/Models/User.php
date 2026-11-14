<?php

namespace App\Modules\Core\Models;

use App\Modules\Core\Enums\Role;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
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
     * School / Tenant relationship.
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
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

