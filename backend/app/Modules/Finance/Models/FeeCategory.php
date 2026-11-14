<?php

namespace App\Modules\Finance\Models;

use App\Modules\Core\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeeCategory extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'fee_categories';

    protected $fillable = [
        'school_id',
        'name',
        'description',
    ];

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}

