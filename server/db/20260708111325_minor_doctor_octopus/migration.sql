CREATE TABLE `congressional_candidate` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`election_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`party` varchar(3) NOT NULL DEFAULT 'IND',
	`status` enum('in','out','undecided') NOT NULL DEFAULT 'undecided'
);
--> statement-breakpoint
CREATE TABLE `election_return` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`election_id` int NOT NULL,
	`votes_counted` int NOT NULL DEFAULT 0,
	`reported_at` timestamp NOT NULL DEFAULT (now())
);
--> statement-breakpoint
ALTER TABLE `congressional_candidate` ADD CONSTRAINT `congressional_candidate_election_id_election_id_fkey` FOREIGN KEY (`election_id`) REFERENCES `election`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `election_return` ADD CONSTRAINT `election_return_election_id_election_id_fkey` FOREIGN KEY (`election_id`) REFERENCES `election`(`id`) ON DELETE CASCADE;