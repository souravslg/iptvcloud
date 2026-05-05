CREATE TABLE `channels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`logo` text,
	`group_title` text,
	`url` text NOT NULL,
	`is_mpd` integer DEFAULT false NOT NULL,
	`clearkey` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
