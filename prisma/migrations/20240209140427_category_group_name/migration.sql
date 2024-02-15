/*
  Warnings:

  - Added the required column `group_name` to the `category` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "category" ADD COLUMN     "group_name" TEXT NOT NULL;
