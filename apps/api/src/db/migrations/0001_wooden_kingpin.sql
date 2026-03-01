CREATE TYPE "public"."phase" AS ENUM('selection', 'active', 'event', 'review', 'completed');--> statement-breakpoint
ALTER TABLE "rounds" ADD COLUMN "phase_override" "phase";