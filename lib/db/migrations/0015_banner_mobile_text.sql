ALTER TABLE "banners" ADD COLUMN "mobile_text_color" text;--> statement-breakpoint
ALTER TABLE "banners" ADD COLUMN "mobile_text_position" text;--> statement-breakpoint
ALTER TABLE "banners" ADD COLUMN "mobile_text_v_align" text;--> statement-breakpoint
ALTER TABLE "banners" ADD COLUMN "mobile_scrim" boolean;--> statement-breakpoint
ALTER TABLE "banners" ADD COLUMN "hide_text_on_mobile" boolean DEFAULT false NOT NULL;