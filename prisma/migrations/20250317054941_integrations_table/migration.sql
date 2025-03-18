-- CreateEnum
CREATE TYPE "AuthType" AS ENUM ('OAUTH2', 'APIKEY');

-- CreateTable
CREATE TABLE "Integration" (
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "authType" "AuthType" NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("name","organizationId")
);

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
