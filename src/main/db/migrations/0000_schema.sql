CREATE TABLE IF NOT EXISTS `days` (
	`id` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `items` (
	`id` text PRIMARY KEY NOT NULL,
	`day_id` text NOT NULL,
	`type` text NOT NULL,
	`content` text,
	`source_url` text,
	`title` text,
	`description` text,
	`thumbnail` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`day_id`) REFERENCES `days`(`id`) ON UPDATE no action ON DELETE no action
);
