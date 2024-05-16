/*
  Warnings:

  - A unique constraint covering the columns `[photo]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `photo` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Product` ADD COLUMN `photo` VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Product_photo_key` ON `Product`(`photo`);
