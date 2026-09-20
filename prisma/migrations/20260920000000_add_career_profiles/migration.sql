CREATE TABLE "CareerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "bio" TEXT,
    "experience" INTEGER,
    "skills" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CareerProfile_userId_industry_key" ON "CareerProfile"("userId", "industry");
CREATE INDEX "CareerProfile_userId_idx" ON "CareerProfile"("userId");
CREATE INDEX "CareerProfile_industry_idx" ON "CareerProfile"("industry");

ALTER TABLE "CareerProfile" ADD CONSTRAINT "CareerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerProfile" ADD CONSTRAINT "CareerProfile_industry_fkey" FOREIGN KEY ("industry") REFERENCES "IndustryInsight"("industry") ON DELETE RESTRICT ON UPDATE CASCADE;