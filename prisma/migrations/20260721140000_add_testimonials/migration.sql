-- CreateEnum (idempotent)
DO $$ BEGIN
    CREATE TYPE "TestimonialSubmissionStatus" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Testimonial" (
    "id" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "mediaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TestimonialSubmission" (
    "id" TEXT NOT NULL,
    "status" "TestimonialSubmissionStatus" NOT NULL DEFAULT 'pending',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "quote" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestimonialSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Testimonial_published_idx" ON "Testimonial"("published");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Testimonial_sortOrder_idx" ON "Testimonial"("sortOrder");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TestimonialSubmission_status_idx" ON "TestimonialSubmission"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TestimonialSubmission_read_idx" ON "TestimonialSubmission"("read");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TestimonialSubmission_createdAt_idx" ON "TestimonialSubmission"("createdAt");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
