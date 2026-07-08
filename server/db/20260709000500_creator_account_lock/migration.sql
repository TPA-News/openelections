ALTER TABLE `users` MODIFY COLUMN `discord_id` varchar(32) NOT NULL;
--> statement-breakpoint

ALTER TABLE `election` ADD COLUMN `created_by_discord_id` varchar(32);
--> statement-breakpoint

ALTER TABLE `election`
  ADD CONSTRAINT `election_created_by_discord_id_users_discord_id_fk`
  FOREIGN KEY (`created_by_discord_id`) REFERENCES `users`(`discord_id`)
  ON DELETE SET NULL ON UPDATE NO ACTION;
