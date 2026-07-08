CREATE TABLE `election` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`name` varchar(100) NOT NULL,
	`status` enum('open','closed','paused') NOT NULL DEFAULT 'open',
	`type` enum('congressional','presidential','parliamentary') NOT NULL DEFAULT 'congressional',
	`created_at` timestamp NOT NULL DEFAULT (now())
);
--> statement-breakpoint
CREATE TABLE `users` (
	`discord_id` int PRIMARY KEY,
	`role` enum('admin','pollbody','viewer') NOT NULL DEFAULT 'pollbody'
);
