CREATE TABLE `days` (
	`id` text PRIMARY KEY NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`day_id` text NOT NULL,
	`type` text NOT NULL,
	`content` text,
	`source_url` text,
	`title` text,
	`description` text,
	`thumbnail` text,
	`image_path` text,
	`platform` text,
	`metadata` text,
	`x` integer DEFAULT 40 NOT NULL,
	`y` integer DEFAULT 40 NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`width_hint` text DEFAULT 'medium' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`day_id`) REFERENCES `days`(`id`) ON UPDATE no action ON DELETE no action
);
