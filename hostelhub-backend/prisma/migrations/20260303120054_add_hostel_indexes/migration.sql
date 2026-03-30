-- CreateIndex
CREATE INDEX "hostel_facilities_hostel_id_idx" ON "hostel_facilities"("hostel_id");

-- CreateIndex
CREATE INDEX "hostel_images_hostel_id_idx" ON "hostel_images"("hostel_id");

-- CreateIndex
CREATE INDEX "hostels_status_idx" ON "hostels"("status");

-- CreateIndex
CREATE INDEX "hostels_manager_id_idx" ON "hostels"("manager_id");

-- CreateIndex
CREATE INDEX "hostels_status_created_at_idx" ON "hostels"("status", "created_at");

-- CreateIndex
CREATE INDEX "hostels_created_at_idx" ON "hostels"("created_at");

-- CreateIndex
CREATE INDEX "room_types_hostel_id_idx" ON "room_types"("hostel_id");
