CREATE TABLE IF NOT EXISTS `congressional_category` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`election_id` int NOT NULL,
	`name` varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `election_return_candidate_status` (
	`id` int AUTO_INCREMENT PRIMARY KEY,
	`return_id` int NOT NULL,
	`candidate_id` int NOT NULL,
	`status` enum('in','out','undecided') NOT NULL DEFAULT 'undecided'
);
--> statement-breakpoint
ALTER TABLE `congressional_candidate` ADD COLUMN IF NOT EXISTS `category_id` int NULL;--> statement-breakpoint
INSERT INTO `congressional_category` (`election_id`, `name`)
SELECT DISTINCT c.`election_id`, 'General'
FROM `congressional_candidate` c
LEFT JOIN `congressional_category` cc
  ON cc.`election_id` = c.`election_id`
 AND cc.`name` = 'General'
WHERE cc.`id` IS NULL;--> statement-breakpoint
UPDATE `congressional_candidate` c
JOIN `congressional_category` cc
  ON cc.`election_id` = c.`election_id`
 AND cc.`name` = 'General'
SET c.`category_id` = cc.`id`
WHERE c.`category_id` IS NULL OR c.`category_id` = 0;--> statement-breakpoint
ALTER TABLE `congressional_candidate` MODIFY `category_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `congressional_candidate` DROP FOREIGN KEY IF EXISTS `congressional_candidate_vaBMAOJiSDuF_fkey`;--> statement-breakpoint
ALTER TABLE `congressional_candidate` ADD CONSTRAINT `congressional_candidate_vaBMAOJiSDuF_fkey` FOREIGN KEY (`category_id`) REFERENCES `congressional_category`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `congressional_category` DROP FOREIGN KEY IF EXISTS `congressional_category_election_id_election_id_fkey`;--> statement-breakpoint
ALTER TABLE `congressional_category` ADD CONSTRAINT `congressional_category_election_id_election_id_fkey` FOREIGN KEY (`election_id`) REFERENCES `election`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `election_return_candidate_status` DROP FOREIGN KEY IF EXISTS `election_return_candidate_status_CjcSkt9fFqc3_fkey`;--> statement-breakpoint
ALTER TABLE `election_return_candidate_status` ADD CONSTRAINT `election_return_candidate_status_CjcSkt9fFqc3_fkey` FOREIGN KEY (`return_id`) REFERENCES `election_return`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `election_return_candidate_status` DROP FOREIGN KEY IF EXISTS `election_return_candidate_status_ECGscJ7U6XCZ_fkey`;--> statement-breakpoint
ALTER TABLE `election_return_candidate_status` ADD CONSTRAINT `election_return_candidate_status_ECGscJ7U6XCZ_fkey` FOREIGN KEY (`candidate_id`) REFERENCES `congressional_candidate`(`id`) ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE `congressional_candidate` DROP COLUMN IF EXISTS `status`;