ALTER TABLE "banners" ADD COLUMN "text_v_align" text DEFAULT 'center' NOT NULL;--> statement-breakpoint
ALTER TABLE "banners" ADD COLUMN "scrim" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "banners" ADD COLUMN "headline_accent" text;