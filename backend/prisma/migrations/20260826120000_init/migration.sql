-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PROCUREMENT_MANAGER', 'LOGISTICS_MANAGER', 'ADMIN', 'VIEWER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargo_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cargo_type" TEXT NOT NULL,
    "quantity_mt" DECIMAL(14,3) NOT NULL,
    "origin_port_id" TEXT NOT NULL,
    "destination_port_id" TEXT NOT NULL,
    "required_date" DATE NOT NULL,
    "contract_duration" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cargo_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vessels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vessel_type" TEXT NOT NULL,
    "capacity_mt" DECIMAL(14,3) NOT NULL,
    "draft_m" DECIMAL(8,3) NOT NULL,
    "loa_m" DECIMAL(8,3) NOT NULL,
    "beam_m" DECIMAL(8,3) NOT NULL,
    "speed_knots" DECIMAL(8,3),
    "fuel_consumption" DECIMAL(12,4),
    "daily_charter_cost" DECIMAL(14,2),
    "availability_status" TEXT NOT NULL,

    CONSTRAINT "vessels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vessel_availability" (
    "id" TEXT NOT NULL,
    "vessel_id" TEXT NOT NULL,
    "available_from" TIMESTAMP(3) NOT NULL,
    "available_until" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "current_location" TEXT,
    "source" TEXT,
    "observed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vessel_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "max_draft_m" DECIMAL(8,3) NOT NULL,
    "max_loa_m" DECIMAL(8,3) NOT NULL,
    "max_beam_m" DECIMAL(8,3) NOT NULL,
    "handling_capacity_mt_day" DECIMAL(14,3) NOT NULL,
    "berth_capacity" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freight_rates" (
    "id" TEXT NOT NULL,
    "observed_at" TIMESTAMP(3) NOT NULL,
    "origin_port_id" TEXT NOT NULL,
    "destination_port_id" TEXT NOT NULL,
    "vessel_type" TEXT NOT NULL,
    "rate_value" DECIMAL(14,4) NOT NULL,
    "currency" TEXT NOT NULL,
    "rate_unit" TEXT NOT NULL,
    "source" TEXT,

    CONSTRAINT "freight_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_prices" (
    "id" TEXT NOT NULL,
    "observed_at" TIMESTAMP(3) NOT NULL,
    "fuel_type" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "price" DECIMAL(14,4) NOT NULL,
    "currency" TEXT NOT NULL,
    "source" TEXT,

    CONSTRAINT "fuel_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commodity_prices" (
    "id" TEXT NOT NULL,
    "observed_at" TIMESTAMP(3) NOT NULL,
    "commodity" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "price" DECIMAL(14,4) NOT NULL,
    "currency" TEXT NOT NULL,
    "source" TEXT,

    CONSTRAINT "commodity_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "economic_indicators" (
    "id" TEXT NOT NULL,
    "observed_at" TIMESTAMP(3) NOT NULL,
    "indicator_name" TEXT NOT NULL,
    "value" DECIMAL(18,6) NOT NULL,
    "unit" TEXT NOT NULL,
    "source" TEXT,

    CONSTRAINT "economic_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "port_congestion" (
    "id" TEXT NOT NULL,
    "observed_at" TIMESTAMP(3) NOT NULL,
    "port_id" TEXT NOT NULL,
    "vessels_waiting" INTEGER NOT NULL,
    "avg_wait_hours" DECIMAL(10,2) NOT NULL,
    "congestion_index" DECIMAL(8,4) NOT NULL,
    "source" TEXT,

    CONSTRAINT "port_congestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_observations" (
    "id" TEXT NOT NULL,
    "observed_at" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "wind_speed" DECIMAL(8,3),
    "rainfall" DECIMAL(10,3),
    "storm_indicator" BOOLEAN NOT NULL DEFAULT false,
    "severity" TEXT,
    "source" TEXT,

    CONSTRAINT "weather_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voyage_plans" (
    "id" TEXT NOT NULL,
    "cargo_request_id" TEXT NOT NULL,
    "vessel_id" TEXT NOT NULL,
    "origin_port_id" TEXT NOT NULL,
    "destination_port_id" TEXT NOT NULL,
    "trip_number" INTEGER NOT NULL,
    "planned_quantity_mt" DECIMAL(14,3) NOT NULL,
    "eta" TIMESTAMP(3),
    "estimated_cost" DECIMAL(14,2),
    "feasibility_status" TEXT NOT NULL,

    CONSTRAINT "voyage_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "cargo_request_id" TEXT NOT NULL,
    "recommended_action" TEXT NOT NULL,
    "window_start" TIMESTAMP(3),
    "window_end" TIMESTAMP(3),
    "expected_freight" DECIMAL(14,4),
    "estimated_total_cost" DECIMAL(14,2),
    "risk_level" TEXT,
    "confidence" DECIMAL(5,4),
    "contract_strategy" TEXT,
    "vessel_plan_json" JSONB,
    "explanation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "cargo_request_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "old_recommendation" TEXT,
    "new_recommendation" TEXT,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMP(3),

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast_records" (
    "id" TEXT NOT NULL,
    "cargo_request_id" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "forecast_json" JSONB NOT NULL,
    "confidence" DECIMAL(5,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forecast_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_breakdowns" (
    "id" TEXT NOT NULL,
    "cargo_request_id" TEXT NOT NULL,
    "voyage_plan_id" TEXT,
    "freight_cost" DECIMAL(14,2) NOT NULL,
    "fuel_cost" DECIMAL(14,2) NOT NULL,
    "port_cost" DECIMAL(14,2) NOT NULL,
    "handling_cost" DECIMAL(14,2) NOT NULL,
    "delay_cost" DECIMAL(14,2) NOT NULL,
    "repositioning_cost" DECIMAL(14,2) NOT NULL,
    "other_cost" DECIMAL(14,2) NOT NULL,
    "total_cost" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_breakdowns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "cargo_requests_user_id_idx" ON "cargo_requests"("user_id");

-- CreateIndex
CREATE INDEX "cargo_requests_origin_port_id_destination_port_id_idx" ON "cargo_requests"("origin_port_id", "destination_port_id");

-- CreateIndex
CREATE INDEX "cargo_requests_required_date_idx" ON "cargo_requests"("required_date");

-- CreateIndex
CREATE INDEX "cargo_requests_status_idx" ON "cargo_requests"("status");

-- CreateIndex
CREATE INDEX "vessels_vessel_type_idx" ON "vessels"("vessel_type");

-- CreateIndex
CREATE INDEX "vessels_availability_status_idx" ON "vessels"("availability_status");

-- CreateIndex
CREATE INDEX "vessel_availability_vessel_id_available_from_idx" ON "vessel_availability"("vessel_id", "available_from");

-- CreateIndex
CREATE INDEX "vessel_availability_status_idx" ON "vessel_availability"("status");

-- CreateIndex
CREATE INDEX "vessel_availability_observed_at_idx" ON "vessel_availability"("observed_at");

-- CreateIndex
CREATE INDEX "ports_country_region_idx" ON "ports"("country", "region");

-- CreateIndex
CREATE INDEX "ports_active_idx" ON "ports"("active");

-- CreateIndex
CREATE INDEX "freight_rates_origin_port_id_destination_port_id_observed_a_idx" ON "freight_rates"("origin_port_id", "destination_port_id", "observed_at");

-- CreateIndex
CREATE INDEX "freight_rates_vessel_type_observed_at_idx" ON "freight_rates"("vessel_type", "observed_at");

-- CreateIndex
CREATE INDEX "fuel_prices_fuel_type_region_observed_at_idx" ON "fuel_prices"("fuel_type", "region", "observed_at");

-- CreateIndex
CREATE INDEX "fuel_prices_observed_at_idx" ON "fuel_prices"("observed_at");

-- CreateIndex
CREATE INDEX "commodity_prices_commodity_market_observed_at_idx" ON "commodity_prices"("commodity", "market", "observed_at");

-- CreateIndex
CREATE INDEX "commodity_prices_observed_at_idx" ON "commodity_prices"("observed_at");

-- CreateIndex
CREATE INDEX "economic_indicators_indicator_name_observed_at_idx" ON "economic_indicators"("indicator_name", "observed_at");

-- CreateIndex
CREATE INDEX "port_congestion_port_id_observed_at_idx" ON "port_congestion"("port_id", "observed_at");

-- CreateIndex
CREATE INDEX "weather_observations_location_observed_at_idx" ON "weather_observations"("location", "observed_at");

-- CreateIndex
CREATE INDEX "weather_observations_observed_at_idx" ON "weather_observations"("observed_at");

-- CreateIndex
CREATE INDEX "voyage_plans_cargo_request_id_idx" ON "voyage_plans"("cargo_request_id");

-- CreateIndex
CREATE INDEX "voyage_plans_vessel_id_idx" ON "voyage_plans"("vessel_id");

-- CreateIndex
CREATE INDEX "voyage_plans_origin_port_id_destination_port_id_idx" ON "voyage_plans"("origin_port_id", "destination_port_id");

-- CreateIndex
CREATE INDEX "recommendations_cargo_request_id_created_at_idx" ON "recommendations"("cargo_request_id", "created_at");

-- CreateIndex
CREATE INDEX "alerts_cargo_request_id_triggered_at_idx" ON "alerts"("cargo_request_id", "triggered_at");

-- CreateIndex
CREATE INDEX "alerts_severity_idx" ON "alerts"("severity");

-- CreateIndex
CREATE INDEX "forecast_records_cargo_request_id_created_at_idx" ON "forecast_records"("cargo_request_id", "created_at");

-- CreateIndex
CREATE INDEX "forecast_records_model_version_idx" ON "forecast_records"("model_version");

-- CreateIndex
CREATE INDEX "cost_breakdowns_cargo_request_id_created_at_idx" ON "cost_breakdowns"("cargo_request_id", "created_at");

-- CreateIndex
CREATE INDEX "cost_breakdowns_voyage_plan_id_idx" ON "cost_breakdowns"("voyage_plan_id");

-- AddForeignKey
ALTER TABLE "cargo_requests" ADD CONSTRAINT "cargo_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_requests" ADD CONSTRAINT "cargo_requests_origin_port_id_fkey" FOREIGN KEY ("origin_port_id") REFERENCES "ports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_requests" ADD CONSTRAINT "cargo_requests_destination_port_id_fkey" FOREIGN KEY ("destination_port_id") REFERENCES "ports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_availability" ADD CONSTRAINT "vessel_availability_vessel_id_fkey" FOREIGN KEY ("vessel_id") REFERENCES "vessels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freight_rates" ADD CONSTRAINT "freight_rates_origin_port_id_fkey" FOREIGN KEY ("origin_port_id") REFERENCES "ports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freight_rates" ADD CONSTRAINT "freight_rates_destination_port_id_fkey" FOREIGN KEY ("destination_port_id") REFERENCES "ports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "port_congestion" ADD CONSTRAINT "port_congestion_port_id_fkey" FOREIGN KEY ("port_id") REFERENCES "ports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voyage_plans" ADD CONSTRAINT "voyage_plans_cargo_request_id_fkey" FOREIGN KEY ("cargo_request_id") REFERENCES "cargo_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voyage_plans" ADD CONSTRAINT "voyage_plans_vessel_id_fkey" FOREIGN KEY ("vessel_id") REFERENCES "vessels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voyage_plans" ADD CONSTRAINT "voyage_plans_origin_port_id_fkey" FOREIGN KEY ("origin_port_id") REFERENCES "ports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voyage_plans" ADD CONSTRAINT "voyage_plans_destination_port_id_fkey" FOREIGN KEY ("destination_port_id") REFERENCES "ports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_cargo_request_id_fkey" FOREIGN KEY ("cargo_request_id") REFERENCES "cargo_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_cargo_request_id_fkey" FOREIGN KEY ("cargo_request_id") REFERENCES "cargo_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forecast_records" ADD CONSTRAINT "forecast_records_cargo_request_id_fkey" FOREIGN KEY ("cargo_request_id") REFERENCES "cargo_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_breakdowns" ADD CONSTRAINT "cost_breakdowns_cargo_request_id_fkey" FOREIGN KEY ("cargo_request_id") REFERENCES "cargo_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_breakdowns" ADD CONSTRAINT "cost_breakdowns_voyage_plan_id_fkey" FOREIGN KEY ("voyage_plan_id") REFERENCES "voyage_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
