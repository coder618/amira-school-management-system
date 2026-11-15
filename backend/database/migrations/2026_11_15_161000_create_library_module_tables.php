<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('title');
            $table->string('author');
            $table->string('isbn')->nullable();
            $table->string('category')->nullable();
            $table->string('publisher')->nullable();
            $table->string('edition')->nullable();
            $table->string('publication_year')->nullable();
            $table->unsignedInteger('total_copies')->default(1);
            $table->unsignedInteger('available_copies')->default(1);
            $table->string('rack_number')->nullable();
            $table->text('description')->nullable();
            $table->string('cover_image')->nullable();
            $table->string('status')->default('available'); // available, maintenance, archived, lost
            $table->timestamps();

            $table->index(['school_id', 'title']);
            $table->index(['school_id', 'author']);
            $table->index(['school_id', 'category']);
            $table->index(['school_id', 'isbn']);
        });

        Schema::create('book_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('book_id')->constrained('books')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('issue_date');
            $table->date('due_date');
            $table->date('return_date')->nullable();
            $table->string('status')->default('issued'); // issued, returned, overdue, lost
            $table->decimal('fine_amount', 10, 2)->default(0.00);
            $table->string('fine_status')->default('unpaid'); // unpaid, paid, waived
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['school_id', 'status']);
            $table->index(['school_id', 'book_id']);
            $table->index(['school_id', 'student_id']);
            $table->index(['school_id', 'due_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('book_issues');
        Schema::dropIfExists('books');
    }
};
