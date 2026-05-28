-- AlterTable
ALTER TABLE "User" ADD COLUMN "displayName" TEXT,
ADD COLUMN "firstName" TEXT,
ADD COLUMN "lastName" TEXT,
ADD COLUMN "coverUrl" TEXT,
ADD COLUMN "location" TEXT,
ADD COLUMN "website" TEXT,
ADD COLUMN "pronouns" TEXT,
ADD COLUMN "gender" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "dateOfBirth" TIMESTAMP(3),
ADD COLUMN "isPrivate" BOOLEAN NOT NULL DEFAULT false;
