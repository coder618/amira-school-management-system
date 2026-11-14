<?php

namespace App\Providers;

use App\Modules\Attendance\Events\AttendanceMarked;
use App\Modules\Attendance\Listeners\SendAbsentSmsNotification;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen(
            AttendanceMarked::class,
            SendAbsentSmsNotification::class
        );
    }
}
