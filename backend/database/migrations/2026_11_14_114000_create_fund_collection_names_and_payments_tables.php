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
        // 1. Create fund_collection_names table
        if (! Schema::hasTable('fund_collection_names')) {
            Schema::create('fund_collection_names', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
                $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete();
                $table->string('name');
                $table->string('interval')->default('Monthly'); // Monthly, Quarterly, 6 Months, Yearly, One-Time
                $table->decimal('default_amount', 12, 2)->default(0.00);
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->unique(['school_id', 'name']);
            });
        }

        // 2. Drop old payments table and recreate with new schema based on FundCollectionName
        Schema::dropIfExists('payments');

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete();
            $table->foreignId('fund_collection_name_id')->constrained('fund_collection_names')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->string('receipt_no')->nullable()->index();
            $table->decimal('amount', 12, 2);
            $table->decimal('paid_amount', 12, 2)->default(0.00);
            $table->decimal('due_amount', 12, 2)->default(0.00);
            $table->enum('status', ['paid', 'due', 'partially_paid', 'cancelled'])->default('due');
            $table->enum('payment_method', ['Cash', 'bKash', 'Nagad', 'Bank', 'Rocket'])->default('Cash');
            $table->string('transaction_id')->nullable()->index();
            $table->date('payment_date')->nullable();
            $table->date('due_date')->nullable();
            $table->string('received_by')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['school_id', 'receipt_no']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('fund_collection_names');
    }
};

