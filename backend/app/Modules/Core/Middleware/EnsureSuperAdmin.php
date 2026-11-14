<?php

namespace App\Modules\Core\Middleware;

use App\Modules\Core\Enums\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ($user->role !== Role::SuperAdmin->value && ! (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()))) {
            return response()->json([
                'message' => 'Forbidden. This action requires SuperAdmin privileges.',
            ], 403);
        }

        return $next($request);
    }
}

