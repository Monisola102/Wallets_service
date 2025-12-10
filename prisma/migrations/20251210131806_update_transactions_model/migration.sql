/*
  Warnings:

  - You are about to drop the column `recipientWalletId` on the `Transaction` table. All the data in the column will be lost.
  - Made the column `reference` on table `Transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "recipientWalletId",
ALTER COLUMN "reference" SET NOT NULL;
