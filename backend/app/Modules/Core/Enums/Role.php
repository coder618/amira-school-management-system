<?php

namespace App\Modules\Core\Enums;

enum Role: string
{
    case SuperAdmin = 'SuperAdmin';
    case Admin = 'Admin';
    case Teacher = 'Teacher';
    case Student = 'Student';
    case StudentParent = 'Student/Parent';

    /**
     * Get all available role values.
     *
     * @return array<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

