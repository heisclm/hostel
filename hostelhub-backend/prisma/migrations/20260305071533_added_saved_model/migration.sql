-- CreateTable
CREATE TABLE "saved_hostels" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "hostel_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_hostels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_hostels_student_id_idx" ON "saved_hostels"("student_id");

-- CreateIndex
CREATE INDEX "saved_hostels_hostel_id_idx" ON "saved_hostels"("hostel_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_hostels_student_id_hostel_id_key" ON "saved_hostels"("student_id", "hostel_id");

-- AddForeignKey
ALTER TABLE "saved_hostels" ADD CONSTRAINT "saved_hostels_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_hostels" ADD CONSTRAINT "saved_hostels_hostel_id_fkey" FOREIGN KEY ("hostel_id") REFERENCES "hostels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
