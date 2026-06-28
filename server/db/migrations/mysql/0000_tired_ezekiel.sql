CREATE TABLE `congressional_candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`election_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`party_abbr` varchar(20) NOT NULL,
	`status` enum('IN','OUT','UNCOUNTED') NOT NULL DEFAULT 'UNCOUNTED',
	CONSTRAINT `congressional_candidates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `congressional_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`election_id` int NOT NULL,
	`total_votes` int NOT NULL DEFAULT 0,
	`votes_counted` int NOT NULL DEFAULT 0,
	CONSTRAINT `congressional_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `elections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`mode` enum('presidential','congressional','parliamentary') NOT NULL,
	`status` enum('ongoing','closed') NOT NULL DEFAULT 'ongoing',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `elections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parliamentary_party_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`election_id` int NOT NULL,
	`party_abbr` varchar(20),
	`party_name` varchar(100),
	`votes` int NOT NULL DEFAULT 0,
	CONSTRAINT `parliamentary_party_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parliamentary_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`election_id` int NOT NULL,
	`total_votes` int NOT NULL DEFAULT 0,
	CONSTRAINT `parliamentary_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `presidential_candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`election_id` int NOT NULL,
	`presidential_name` varchar(100) NOT NULL,
	`vice_name` varchar(100) NOT NULL,
	`party_abbr` varchar(20) NOT NULL,
	`votes` int NOT NULL DEFAULT 0,
	CONSTRAINT `presidential_candidates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `presidential_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`election_id` int NOT NULL,
	`total_votes` int NOT NULL DEFAULT 0,
	CONSTRAINT `presidential_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `congressional_candidates` ADD CONSTRAINT `congressional_candidates_election_id_elections_id_fk` FOREIGN KEY (`election_id`) REFERENCES `elections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `congressional_results` ADD CONSTRAINT `congressional_results_election_id_elections_id_fk` FOREIGN KEY (`election_id`) REFERENCES `elections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parliamentary_party_votes` ADD CONSTRAINT `parliamentary_party_votes_election_id_elections_id_fk` FOREIGN KEY (`election_id`) REFERENCES `elections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parliamentary_results` ADD CONSTRAINT `parliamentary_results_election_id_elections_id_fk` FOREIGN KEY (`election_id`) REFERENCES `elections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `presidential_candidates` ADD CONSTRAINT `presidential_candidates_election_id_elections_id_fk` FOREIGN KEY (`election_id`) REFERENCES `elections`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `presidential_results` ADD CONSTRAINT `presidential_results_election_id_elections_id_fk` FOREIGN KEY (`election_id`) REFERENCES `elections`(`id`) ON DELETE no action ON UPDATE no action;