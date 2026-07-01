-- Grid layout orders by created_at; freeform canvas columns are unused.

ALTER TABLE `items` DROP COLUMN `x`;

ALTER TABLE `items` DROP COLUMN `y`;

ALTER TABLE `items` DROP COLUMN `position`;

ALTER TABLE `items` DROP COLUMN `width_hint`;
