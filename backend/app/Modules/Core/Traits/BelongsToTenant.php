<?php

namespace App\Modules\Core\Traits;

use App\Modules\Core\Models\AcademicYear;
use App\Modules\Core\Models\School;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToTenant
{
    /**
     * Boot the BelongsToTenant trait.
     */
    public static function bootBelongsToTenant(): void
    {
        static::creating(function ($model) {
            // Automatically assign school_id
            if (empty($model->school_id)) {
                if (request()->hasHeader('X-School-Id')) {
                    $model->school_id = (int) request()->header('X-School-Id');
                } elseif (auth()->check() && auth()->user()->school_id) {
                    $model->school_id = auth()->user()->school_id;
                } else {
                    $firstSchool = School::first();
                    if ($firstSchool) {
                        $model->school_id = $firstSchool->id;
                    }
                }
            }

            // Automatically assign academic_year_id if column exists on model
            if (\Illuminate\Support\Facades\Schema::hasColumn($model->getTable(), 'academic_year_id')) {
                if (empty($model->academic_year_id)) {
                    if (request()->hasHeader('X-Academic-Year-Id')) {
                        $model->academic_year_id = (int) request()->header('X-Academic-Year-Id');
                    } elseif (! empty($model->school_id)) {
                        $currentYear = AcademicYear::where('school_id', $model->school_id)
                            ->where('is_current', true)
                            ->first();
                        if ($currentYear) {
                            $model->academic_year_id = $currentYear->id;
                        }
                    }
                }
            }
        });
    }

    /**
     * School relationship (Tenant).
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Academic Year relationship (Academic Tenant Dimension).
     */
    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    /**
     * Scope query to a specific school tenant.
     */
    public function scopeForSchool(Builder $query, int $schoolId): Builder
    {
        return $query->where($this->qualifyColumn('school_id'), $schoolId);
    }

    /**
     * Scope query to a specific academic year.
     */
    public function scopeForAcademicYear(Builder $query, int $academicYearId): Builder
    {
        return $query->where($this->qualifyColumn('academic_year_id'), $academicYearId);
    }

    /**
     * Scope query for complete tenant isolation (School & Academic Year).
     */
    public function scopeForTenant(Builder $query, ?int $schoolId = null, ?int $academicYearId = null): Builder
    {
        $resolvedSchoolId = $schoolId ?? (auth()->check() ? auth()->user()->school_id : null) ?? (request()->header('X-School-Id') ? (int) request()->header('X-School-Id') : null);

        if ($resolvedSchoolId) {
            $query->where($this->qualifyColumn('school_id'), $resolvedSchoolId);
        }

        $resolvedYearId = $academicYearId ?? (request()->header('X-Academic-Year-Id') ? (int) request()->header('X-Academic-Year-Id') : null);

        if ($resolvedYearId && \Illuminate\Support\Facades\Schema::hasColumn($this->getTable(), 'academic_year_id')) {
            $query->where($this->qualifyColumn('academic_year_id'), $resolvedYearId);
        }

        return $query;
    }
}
