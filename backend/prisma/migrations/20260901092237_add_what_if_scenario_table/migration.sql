-- CreateTable
CREATE TABLE "what_if_scenarios" (
    "id" TEXT NOT NULL,
    "cargo_request_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity_mt" DECIMAL(65,30) NOT NULL,
    "required_date" TIMESTAMP(3) NOT NULL,
    "origin_port_id" TEXT NOT NULL,
    "destination_port_id" TEXT NOT NULL,
    "vessel_plan_json" JSONB,
    "analysis_json" JSONB,
    "forecast_json" JSONB,
    "risk_json" JSONB,
    "optimization_json" JSONB,
    "cost_json" JSONB,
    "recommendation_json" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "what_if_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "what_if_scenarios_cargo_request_id_created_at_idx" ON "what_if_scenarios"("cargo_request_id", "created_at");

-- CreateIndex
CREATE INDEX "what_if_scenarios_origin_port_id_idx" ON "what_if_scenarios"("origin_port_id");

-- CreateIndex
CREATE INDEX "what_if_scenarios_destination_port_id_idx" ON "what_if_scenarios"("destination_port_id");

-- CreateIndex
CREATE INDEX "what_if_scenarios_status_idx" ON "what_if_scenarios"("status");

-- AddForeignKey
ALTER TABLE "what_if_scenarios" ADD CONSTRAINT "what_if_scenarios_cargo_request_id_fkey" FOREIGN KEY ("cargo_request_id") REFERENCES "cargo_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "what_if_scenarios" ADD CONSTRAINT "what_if_scenarios_origin_port_id_fkey" FOREIGN KEY ("origin_port_id") REFERENCES "ports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "what_if_scenarios" ADD CONSTRAINT "what_if_scenarios_destination_port_id_fkey" FOREIGN KEY ("destination_port_id") REFERENCES "ports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
